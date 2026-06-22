import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, ResponsiveContainer, ReferenceLine, Tooltip, YAxis } from "recharts";

const API = "https://profTowelBot.serveousercontent.com";
const POLL_MS = 2000;

const C = {
  bg:"#07090f",panel:"#0c1120",panel2:"#101828",border:"#1a2640",border2:"#243352",
  accent:"#00c8ff",gold:"#f0b429",green:"#00e676",red:"#ff4455",purple:"#a78bfa",
  orange:"#ff9500",muted:"#3a5070",text:"#c0d0e8",sub:"#6080a0",white:"#e8f0f8",
};

const useRealtime = () => {
  const [data,setData]=useState(null);const [online,setOnline]=useState(false);const [ping,setPing]=useState(null);
  const [pnlHistory,setPnlHistory]=useState([]);
  const poll=useCallback(async()=>{const t0=Date.now();try{const r=await fetch(`${API}/status`,{cache:"no-store"});const d=await r.json();setData(d);setOnline(true);setPing(Date.now()-t0);setPnlHistory(p=>[...p,{t:new Date().toLocaleTimeString(),pnl:d.daily_pnl||0}].slice(-120));}catch{setOnline(false);setPing(null);};},[]);
  useEffect(()=>{poll();const t=setInterval(poll,POLL_MS);return()=>clearInterval(t);},[poll]);
  return{data,online,ping,pnlHistory,refresh:poll};
};

const Dot=({on,size=8})=><span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:on?C.green:C.red,boxShadow:on?`0 0 ${size}px ${C.green}88`:"none",flexShrink:0}}/>;
const Tag=({label,color,dim})=><span style={{background:(color||C.accent)+(dim?"18":"28"),color:dim?C.sub:(color||C.accent),border:`1px solid ${(color||C.accent)}${dim?"30":"55"}`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{label}</span>;
const Card=({children,style={}})=><div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:16,...style}}>{children}</div>;
const CardTitle=({children,right})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{color:C.accent,fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>{children}</div>{right&&<div>{right}</div>}</div>;
const Btn=({children,onClick,color=C.accent,disabled,full,style={}})=><button onClick={onClick} disabled={disabled} style={{background:color+"22",border:`1px solid ${color}66`,color,borderRadius:7,padding:"9px 16px",cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:12,opacity:disabled?.5:1,width:full?"100%":"auto",transition:"all .15s",...style}}>{children}</button>;
const Input=({value,onChange,type="text",placeholder,style={}})=><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:6,color:C.text,padding:"5px 10px",fontSize:12,fontFamily:"monospace",width:"100%",boxSizing:"border-box",...style}}/>;
const Row=({label,children})=><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.sub,fontSize:12,flex:1,marginRight:12}}>{label}</span><div style={{flex:1,maxWidth:200}}>{children}</div></div>;
const GaugeBar=({value,max,color})=><div style={{background:C.bg,borderRadius:4,height:6,overflow:"hidden"}}><div style={{width:`${Math.min(100,Math.max(0,(value/max)*100))}%`,height:"100%",background:color,borderRadius:4,transition:"width .8s"}}/></div>;

const PnLChart=({data})=>{
  if(!data||data.length<2)return<div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",color:C.sub,fontSize:12}}>Accumulating data...</div>;
  const last=data[data.length-1]?.pnl||0;const col=last>=0?C.green:C.red;
  return<ResponsiveContainer width="100%" height={80}><AreaChart data={data} margin={{top:4,right:0,left:0,bottom:0}}><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={col} stopOpacity={.35}/><stop offset="95%" stopColor={col} stopOpacity={0}/></linearGradient></defs><ReferenceLine y={0} stroke={C.border2} strokeDasharray="3 3"/><Area type="monotone" dataKey="pnl" stroke={col} strokeWidth={2} fill="url(#pg)" dot={false}/><YAxis hide domain={["auto","auto"]}/><Tooltip contentStyle={{background:C.panel2,border:`1px solid ${C.border2}`,borderRadius:6,fontSize:11}} formatter={v=>[`$${Number(v).toFixed(2)}`,"P&L"]}/></AreaChart></ResponsiveContainer>;
};

const KZClock=({now})=>{
  const et=new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"}));
  const hm=et.getHours()*60+et.getMinutes();
  const zones=[{label:"London Open",start:120,end:300,color:C.purple},{label:"NY Open",start:570,end:660,color:C.gold},{label:"NY PM Macro",start:810,end:960,color:C.accent},{label:"Asian / Your Window",start:1140,end:1380,color:C.green}];
  return<div style={{display:"flex",flexDirection:"column",gap:7}}>{zones.map(z=>{const active=hm>=z.start&&hm<z.end;const pct=active?((hm-z.start)/(z.end-z.start))*100:0;return<div key={z.label} style={{background:C.bg,border:`1px solid ${active?z.color+"66":C.border}`,borderRadius:7,padding:"8px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:active?6:0}}><div style={{display:"flex",alignItems:"center",gap:8}}>{active&&<Dot on size={7}/>}<span style={{color:active?z.color:C.sub,fontSize:12,fontWeight:active?700:400}}>{z.label}</span></div><span style={{color:C.sub,fontSize:10}}>{Math.floor(z.start/60)}:{String(z.start%60).padStart(2,"0")}â€“{Math.floor(z.end/60)}:{String(z.end%60).padStart(2,"0")} ET</span></div>{active&&<GaugeBar value={pct} max={100} color={z.color}/>}</div>;})}</div>;
};

const TradeRow=({t})=><div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:11}}><span style={{color:C.sub,width:65,flexShrink:0}}>{t.time}</span><Tag label={t.action} color={t.action==="buy"?C.green:C.red}/><span style={{color:C.text,fontFamily:"monospace",flex:1}}>{t.symbol}</span><span style={{color:C.sub}}>Ã—{t.qty}</span><span style={{color:t.pnl>=0?C.green:C.red,fontFamily:"monospace",fontWeight:700,width:70,textAlign:"right"}}>{t.pnl!==undefined?`${t.pnl>=0?"+":""}$${Number(t.pnl).toFixed(2)}`:"open"}</span></div>;

const Console=({logs})=>{const ref=useRef(null);useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[logs]);const tc={error:C.red,success:C.green,warn:C.gold,info:C.sub};return<div ref={ref} style={{background:C.bg,borderRadius:7,padding:12,height:220,overflowY:"auto",fontFamily:"monospace",fontSize:11}}>{!logs?.length?<div style={{color:C.muted}}>Waiting for bot activity...</div>:[...logs].reverse().map((l,i)=><div key={i} style={{color:tc[l.type]||C.sub,marginBottom:2}}><span style={{color:C.muted}}>[{l.time}] </span>{l.msg}</div>)}</div>;};

// â”€â”€ Backtest Panel (all 3 strategies) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BacktesterPanel=()=>{
  const[strategy,setStrategy]=useState("trend_tracer");
  const[running,setRunning]=useState(false);
  const[results,setResults]=useState(null);
  const[symbol,setSymbol]=useState("NQ=F");
  const[period,setPeriod]=useState("60d");
  const[allHours,setAllHours]=useState(true);
  const[param1,setParam1]=useState("2");
  const[param2,setParam2]=useState("1.5");
  const[param3,setParam3]=useState("3.0");

  const STRATS={
    trend_tracer:{label:"OCO Trend Tracer",emoji:"ðŸŽ¯",color:C.accent,file:"trend_tracer_backtester.py",
      systems:["Session VWAP + Â±1Ïƒ/Â±2Ïƒ bands","Chaikin Money Flow (IR 2.0)","Chaikin Oscillator (IR 1.5)","7-TF Trend Matrix (IR 1.8)","Asian Raid Detection (IR 2.5 â€” highest)","CHoCH / BOS Structure (IR 2.0)","CMF Divergence â€” money loading (IR 1.8)","Kill Zones: NY Open + London Close + PM Macro"],
      p1:"Min Tier (1=SNIPER 2=VALID 3=WATCH)",p2:"SL ATR Mult",p3:"TP2 R-Multiple",
      p1d:"2",p2d:"1.0",p3d:"3.0",
      prompt:(s,p,t,ah,p1,p2,p3)=>`ProfTowel OCO Trend Tracer backtester. Symbol:${s} Period:${p} Tier:${p1}(1=SNIPERâ‰¥6pts 2=VALIDâ‰¥4pts 3=WATCHâ‰¥2pts) SL:${p2}xATR TP2:${p3}R ${ah?"All hours":"NY session 9:30-16 ET"}
IR weights: Asian Raid 2.5, CMF 2.0, VWAP Band 2.0, CHoCH 2.0, MTF 1.8, CMF Div 1.8, CO 1.5, KillZone 1.2, Volume 1.2, Pivot 0.5
Return ONLY JSON: {"total_trades":number,"long_trades":number,"short_trades":number,"win_rate":number,"long_wr":number,"short_wr":number,"net_pnl":number,"avg_win":number,"avg_loss":number,"profit_factor":number,"max_drawdown":number,"sharpe_ratio":number,"ir_net":number,"expectancy":number,"ir_grade":"GOOD (>1.0)" or "MARGINAL (0.5-1.0)" or "POOR (<0.5)","verdict":"ACCEPTED" or "MARGINAL" or "REJECTED","exits":{"TP2":number,"TP1":number,"SL":number,"EOD":number},"by_tier":{"1":number,"2":number,"3":number}}`},
    renaissance:{label:"Renaissance Trend Scalper",emoji:"ðŸ§®",color:C.purple,file:"renaissance_backtester.py",
      systems:["Bayesian ATR Shrinkage (Î´=0.3)","IR-Weighted Oscillator Score","RSI(1.0) + MACD(0.8) + CMF(1.2) + CO(0.5)","3-EMA Trend Grading (9/21/50)","Triple-A: Absorptionâ†’Accumulationâ†’Aggression","EMSD Normalisation"],
      p1:"Score Threshold (0-4)",p2:"SL Mult (x ATR)",p3:"TP2 R-Multiple",
      p1d:"1.5",p2d:"1.5",p3d:"3.75",
      prompt:(s,p,t,ah,p1,p2,p3)=>`ProfTowel Renaissance Trend Scalper backtester. Symbol:${s} Period:${p} ScoreThresh:${p1} SL:${p2}xATR TP2:${p3}R ${ah?"All hours":"Asian 4-8PM Pacific"}
Return ONLY JSON: {"total_trades":number,"win_rate":number,"net_pnl":number,"avg_win":number,"avg_loss":number,"profit_factor":number,"max_drawdown":number,"sharpe_ratio":number,"ir_net":number,"expectancy":number,"ir_grade":"GOOD (>1.0)" or "MARGINAL (0.5-1.0)" or "POOR (<0.5)","verdict":"ACCEPTED" or "MARGINAL" or "REJECTED","exits":{"TP2":number,"TP1":number,"SL":number,"timeout":number}}`},
    breakout:{label:"Breakout Channel Sniper v2",emoji:"âš¡",color:C.gold,file:"breakout_sniper_backtester.py",
      systems:["Donchian Consolidation Channel","VPIN Toxicity (Easley/LÃ³pez de Prado)","Dual VWAP (session + prior day)","S&R Volume Pivots (ChartPrime)","Candlestick Reader (8 bull + 8 bear)","5-TF MTF Trend (1D/4H/1H/30M/15M)"],
      p1:"Min Score (0-22)",p2:"SL Buffer (pts)",p3:"TP2 R-Multiple",
      p1d:"6",p2d:"0.75",p3d:"3.0",
      prompt:(s,p,t,ah,p1,p2,p3)=>`ProfTowel Breakout Channel Sniper v2 backtester. Symbol:${s} Period:${p} MinScore:${p1}/22 SLbuf:${p2}pts TP2:${p3}R ${ah?"All hours":"NY session"}
Scoring: A+(14+) A(10+) B(6+). TP1=max(1.5R,1xChannel) TP2=max(3R,1.618xChannel)
Return ONLY JSON: {"total_trades":number,"long_trades":number,"short_trades":number,"win_rate":number,"long_wr":number,"short_wr":number,"net_pnl":number,"avg_win":number,"avg_loss":number,"profit_factor":number,"max_drawdown":number,"sharpe_ratio":number,"ir_net":number,"expectancy":number,"ir_grade":"GOOD (>1.0)" or "MARGINAL (0.5-1.0)" or "POOR (<0.5)","verdict":"ACCEPTED" or "MARGINAL" or "REJECTED","exits":{"TP2":number,"TP1":number,"SL":number,"EOD_loss":number},"grade_breakdown":{"A+":number,"A":number,"B":number,"C":number}}`},
  };

  const S=STRATS[strategy];

  const run=async()=>{
    setRunning(true);setResults(null);
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,
          messages:[{role:"user",content:S.prompt(symbol,period,"",allHours,param1,param2,param3)}]})});
      const d=await resp.json();
      const raw=d.content?.[0]?.text?.replace(/```json|```/g,"").trim();
      setResults({...JSON.parse(raw),_strategy:strategy});
    }catch(e){setResults({error:e.message});}
    setRunning(false);
  };

  const irColor=r=>r?.ir_net>1?C.green:r?.ir_net>0.5?C.gold:C.red;

  const cliMap={
    trend_tracer:`venv\\Scripts\\python.exe trend_tracer_backtester.py --symbol ${symbol} --period ${period} --interval 5m --tier ${param1} --sl_mult ${param2} --tp2_r ${param3}${allHours?" --all_hours":""}`,
    renaissance:`venv\\Scripts\\python.exe renaissance_backtester.py --symbol ${symbol} --period ${period} --interval 5m --threshold ${param1} --sl_mult ${param2}${allHours?" --all_hours":""}`,
    breakout:`venv\\Scripts\\python.exe breakout_sniper_backtester.py --symbol ${symbol} --period ${period} --interval 5m --threshold ${param1} --sl_buf ${param2}${allHours?" --all_hours":""}`,
  };

  return(
    <div>
      {/* Strategy selector */}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        {Object.entries(STRATS).map(([k,s])=>(
          <button key={k} onClick={()=>{setStrategy(k);setResults(null);setParam1(s.p1d);setParam2(s.p2d);setParam3(s.p3d);}} style={{flex:1,background:strategy===k?s.color+"22":C.panel,border:`2px solid ${strategy===k?s.color:C.border}`,color:strategy===k?s.color:C.sub,borderRadius:9,padding:"12px 16px",cursor:"pointer",fontWeight:800,fontSize:12,transition:"all .2s"}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.emoji}</div>
            <div style={{fontSize:11}}>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:14}}>
        <div style={{flex:1}}>
          <Card style={{marginBottom:14}}>
            <CardTitle right={<Tag label={S.label} color={S.color}/>}>Parameters</CardTitle>
            <Row label="Symbol"><Input value={symbol} onChange={setSymbol}/></Row>
            <Row label="Period"><Input value={period} onChange={setPeriod} placeholder="30d/60d/90d"/></Row>
            <Row label={S.p1}><Input value={param1} onChange={setParam1} type="number"/></Row>
            <Row label={S.p2}><Input value={param2} onChange={setParam2} type="number"/></Row>
            <Row label={S.p3}><Input value={param3} onChange={setParam3} type="number"/></Row>
            <Row label="Session">
              <div style={{display:"flex",gap:8}}>
                {[["All Hours",true],["Session Only",false]].map(([l,v])=>(
                  <button key={l} onClick={()=>setAllHours(v)} style={{flex:1,background:allHours===v?C.accent+"22":C.bg,border:`1px solid ${allHours===v?C.accent:C.border}`,color:allHours===v?C.accent:C.sub,borderRadius:6,padding:"5px",cursor:"pointer",fontSize:11,fontWeight:700}}>{l}</button>
                ))}
              </div>
            </Row>
            <div style={{marginTop:14}}>
              <Btn onClick={run} disabled={running} color={S.color} full style={{padding:12}}>
                {running?`â³ Running ${S.emoji}...`:`${S.emoji} Run ${S.label} Backtest`}
              </Btn>
            </div>
          </Card>

          <Card style={{marginBottom:14}}>
            <CardTitle right={<Tag label={`${S.emoji} Systems`} color={S.color} dim/>}>Active Systems</CardTitle>
            {S.systems.map((sys,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:11}}>
                <span style={{color:S.color}}>â–¸</span><span style={{color:C.text}}>{sys}</span>
              </div>
            ))}
          </Card>

          <Card>
            <CardTitle>Terminal Command</CardTitle>
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:10,fontFamily:"monospace",fontSize:10,color:C.accent,wordBreak:"break-all",lineHeight:1.6}}>
              {cliMap[strategy]}
            </div>
          </Card>
        </div>

        <div style={{flex:1}}>
          {!results?(
            <Card style={{minHeight:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{textAlign:"center",color:C.sub}}>
                <div style={{fontSize:48,marginBottom:16}}>{S.emoji}</div>
                <div style={{fontSize:14,color:C.text,marginBottom:8}}>{S.label}</div>
                <div style={{fontSize:11}}>Configure and click Run</div>
              </div>
            </Card>
          ):results.error?(
            <Card><div style={{color:C.red,fontSize:12}}>Error: {results.error}</div></Card>
          ):(
            <div>
              <Card style={{marginBottom:14}}>
                <CardTitle right={<Tag label={results.ir_grade} color={irColor(results)}/>}>
                  {S.emoji} Results â€” {symbol} {period}
                </CardTitle>

                <div style={{background:(results.verdict==="ACCEPTED"?C.green:results.verdict==="MARGINAL"?C.gold:C.red)+"18",border:`1px solid ${results.verdict==="ACCEPTED"?C.green:results.verdict==="MARGINAL"?C.gold:C.red}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12}}>
                  <span style={{fontWeight:700,color:results.verdict==="ACCEPTED"?C.green:results.verdict==="MARGINAL"?C.gold:C.red}}>
                    {results.verdict==="ACCEPTED"?"âœ… SIGNAL ACCEPTED":results.verdict==="MARGINAL"?"âš  MARGINAL":"âŒ REJECTED"}
                  </span>
                  <span style={{color:C.sub,marginLeft:8}}>Net IR: {Number(results.ir_net).toFixed(3)} â€” {results.ir_grade}</span>
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                  {[
                    ["Trades",results.total_trades,C.text],
                    ["Win Rate",Number(results.win_rate).toFixed(1)+"%",results.win_rate>55?C.green:C.red],
                    ["Net P&L",`$${Number(results.net_pnl).toFixed(2)}`,results.net_pnl>0?C.green:C.red],
                    ["Profit Factor",Number(results.profit_factor).toFixed(2),results.profit_factor>1.5?C.green:C.gold],
                    ["Max DD",`$${Number(results.max_drawdown).toFixed(2)}`,C.red],
                    ["Sharpe",Number(results.sharpe_ratio).toFixed(3),C.purple],
                    ["Net IR",Number(results.ir_net).toFixed(3),irColor(results)],
                    ["Expectancy",`$${Number(results.expectancy).toFixed(2)}`,results.expectancy>0?C.green:C.red],
                  ].map(([l,v,col])=>(
                    <div key={l} style={{flex:"1 0 40%",background:C.bg,borderRadius:7,padding:"10px 12px"}}>
                      <div style={{color:C.sub,fontSize:10,marginBottom:3}}>{l}</div>
                      <div style={{color:col,fontFamily:"monospace",fontWeight:700,fontSize:15}}>{v}</div>
                    </div>
                  ))}
                </div>

                {(results.long_trades!==undefined)&&(
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    {[["LONG",results.long_trades,results.long_wr,C.green],["SHORT",results.short_trades,results.short_wr,C.red]].map(([l,cnt,wr,col])=>(
                      <div key={l} style={{flex:1,background:C.bg,borderRadius:7,padding:"10px 12px",textAlign:"center"}}>
                        <Tag label={l} color={col}/>
                        <div style={{color:col,fontSize:18,fontWeight:800,fontFamily:"monospace",marginTop:6}}>{cnt}</div>
                        <div style={{color:C.sub,fontSize:10}}>WR: {Number(wr||0).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                )}

                {results.exits&&(
                  <div style={{marginBottom:14}}>
                    <div style={{color:C.sub,fontSize:10,letterSpacing:1,marginBottom:8}}>EXIT BREAKDOWN</div>
                    {Object.entries(results.exits).map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                        <span style={{color:k.includes("TP")?C.green:k==="SL"?C.red:C.sub}}>{k}</span>
                        <span style={{color:C.text,fontFamily:"monospace"}}>{v} trades</span>
                      </div>
                    ))}
                  </div>
                )}

                {results.grade_breakdown&&(
                  <div>
                    <div style={{color:C.sub,fontSize:10,letterSpacing:1,marginBottom:8}}>GRADE BREAKDOWN</div>
                    {Object.entries(results.grade_breakdown).map(([g,cnt])=>(
                      <div key={g} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                        <Tag label={`Grade ${g}`} color={g==="A+"?C.green:g==="A"?C.accent:g==="B"?C.gold:C.muted}/>
                        <span style={{color:C.text,fontFamily:"monospace"}}>{cnt} trades</span>
                      </div>
                    ))}
                  </div>
                )}

                {results.by_tier&&(
                  <div>
                    <div style={{color:C.sub,fontSize:10,letterSpacing:1,marginBottom:8}}>TIER BREAKDOWN</div>
                    {Object.entries(results.by_tier).map(([t,cnt])=>(
                      <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                        <Tag label={`Tier ${t}`} color={t==="1"?C.green:t==="2"?C.accent:C.gold}/>
                        <span style={{color:C.text,fontFamily:"monospace"}}>{cnt} trades</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <CardTitle>Tuning</CardTitle>
                <div style={{fontSize:12,color:C.sub,lineHeight:1.8}}>
                  {results.ir_net>1&&<div style={{color:C.green}}>âœ… Meets Renaissance IR standard. Deploy at current settings.</div>}
                  {results.ir_net<=1&&results.ir_net>0.5&&<div><div style={{color:C.gold,marginBottom:6}}>âš  IR marginal. Try tightening parameters or restricting to kill zones only.</div></div>}
                  {results.ir_net<=0.5&&<div style={{color:C.red}}>âŒ IR poor. Filter more aggressively â€” raise threshold and use session-only mode.</div>}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MAIN DASHBOARD â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function ProfessorTowelDashboard(){
  const{data,online,ping,pnlHistory,refresh}=useRealtime();
  const[tab,setTab]=useState("monitor");const[now,setNow]=useState(new Date());
  const[isTesting,setIsTesting]=useState(false);const[isFlattening,setIsFlattening]=useState(false);
  const[testResult,setTestResult]=useState(null);const[flatResult,setFlatResult]=useState(null);
  const[manualAction,setManualAction]=useState("buy");const[manualQty,setManualQty]=useState("1");const[manualResult,setManualResult]=useState(null);
  const[config,setConfig]=useState({symbol:"MNQU6",maxDailyLoss:"1000",maxDrawdown:"2000",maxPosition:"3",loopInterval:"60",webhookSecret:"changeme123",minConfidence:"65",tradingStart:"09:30",tradingEnd:"16:00",ollamaModel:"deepseek-r1:7b",tunnelUrl:"https://profTowelBot.serveo.net"});

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);

  const pnl=data?.daily_pnl??0;const balance=data?.balance??50000;const bars=data?.bars_received??0;
  const halted=data?.trading_halted??false;const lastBar=data?.last_bar;const trades=data?.trades??[];const logs=data?.logs??[];const online_=!( !online);

  const sendTest=async()=>{setIsTesting(true);setTestResult(null);try{const r=await fetch(`${API}/webhook`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:config.webhookSecret,symbol:config.symbol,action:"buy",qty:1,bar:{open:21000,high:21020,low:20990,close:21010,volume:1200,time:new Date().toISOString(),interval:"5"}})});const d=await r.json();setTestResult({ok:true,data:d});}catch(e){setTestResult({ok:false,msg:e.message});}setIsTesting(false);};
  const sendFlatten=async()=>{setIsFlattening(true);setFlatResult(null);try{const r=await fetch(`${API}/flatten`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:config.webhookSecret,symbol:config.symbol})});const d=await r.json();setFlatResult({ok:true,msg:d.status});}catch(e){setFlatResult({ok:false,msg:e.message});}setIsFlattening(false);};
  const sendManual=async()=>{setManualResult(null);try{const r=await fetch(`${API}/webhook`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:config.webhookSecret,symbol:config.symbol,action:manualAction,qty:parseInt(manualQty),bar:lastBar||{open:0,high:0,low:0,close:0,volume:0,time:new Date().toISOString(),interval:"5"}})});const d=await r.json();setManualResult({ok:true,data:d});}catch(e){setManualResult({ok:false,msg:e.message});}};

  const TABS=[{id:"monitor",label:"ðŸ“Š Monitor"},{id:"trade",label:"âš¡ Trade"},{id:"backtest",label:"ðŸ“ˆ Backtest"},{id:"risk",label:"ðŸ›¡ Risk"},{id:"config",label:"âš™ Config"},{id:"console",label:"ðŸ–¥ Console"}];

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter',system-ui,sans-serif"}}>
      {/* HEADER */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${C.accent},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>ðŸŽ“</div>
            <div><div style={{color:C.white,fontWeight:900,fontSize:15,letterSpacing:2}}>PROFESSORTOWEL</div><div style={{color:C.sub,fontSize:9,letterSpacing:3}}>AUTONOMOUS TRADING SYSTEM v1.0</div></div>
          </div>
          <div style={{display:"flex",gap:20,alignItems:"center"}}>
            {[["SYMBOL",config.symbol,C.gold],["DAILY P&L",`${pnl>=0?"+":""}$${Number(pnl).toFixed(2)}`,pnl>=0?C.green:C.red],["BALANCE",`$${Number(balance).toLocaleString()}`,C.text],["BARS",bars,C.accent],["LAST",lastBar?.close?`$${Number(lastBar.close).toFixed(2)}`:"â€”",C.gold]].map(([l,v,col])=>(
              <div key={l} style={{textAlign:"center"}}><div style={{color:C.sub,fontSize:9,letterSpacing:1}}>{l}</div><div style={{color:col,fontSize:13,fontFamily:"monospace",fontWeight:700}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{textAlign:"right"}}><div style={{color:C.sub,fontSize:9}}>ET TIME</div><div style={{color:C.text,fontSize:12,fontFamily:"monospace"}}>{new Date(now.toLocaleString("en-US",{timeZone:"America/New_York"})).toLocaleTimeString()}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:6,background:C.bg,border:`1px solid ${online_?C.green:C.red}55`,borderRadius:6,padding:"4px 10px"}}><Dot on={online_} size={7}/><span style={{fontSize:11,color:online_?C.green:C.red,fontWeight:700}}>{online_?`LIVE ${ping}ms`:"OFFLINE"}</span></div>
            {halted&&<Tag label="HALTED" color={C.red}/>}
            <button onClick={refresh} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.sub,padding:"4px 8px",cursor:"pointer",fontSize:13}}>â†»</button>
          </div>
        </div>
        <div style={{display:"flex",paddingLeft:20}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px 16px",fontSize:11,fontWeight:700,letterSpacing:.5,color:tab===t.id?C.accent:C.sub,borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`,transition:"all .15s"}}>{t.label}</button>)}
        </div>
      </div>

      {halted&&<div style={{background:C.red+"18",borderBottom:`1px solid ${C.red}44`,padding:"8px 20px",display:"flex",gap:10}}><span>â›”</span><span style={{color:C.red,fontWeight:700,fontSize:12}}>TRADING HALTED â€” Daily loss limit reached. Resumes midnight ET. P&L: ${Number(pnl).toFixed(2)} / Limit: -${config.maxDailyLoss}</span></div>}

      <div style={{padding:"16px 20px",maxWidth:1200,margin:"0 auto"}}>

        {/* MONITOR */}
        {tab==="monitor"&&<div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            {[["Daily P&L",`${pnl>=0?"+":""}$${Number(pnl).toFixed(2)}`,pnl>=0?C.green:C.red],["Balance",`$${Number(balance).toLocaleString()}`,C.gold],["Bars",bars,C.accent],["Last Price",lastBar?.close?`$${Number(lastBar.close).toFixed(2)}`:"â€”",C.gold],["Model",config.ollamaModel.split(":")[0],C.purple],["Status",halted?"HALTED":online_?"LIVE":"OFFLINE",halted?C.red:online_?C.green:C.red]].map(([l,v,col])=>(
              <div key={l} style={{flex:1,minWidth:90,background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}><div style={{color:C.sub,fontSize:9,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{l}</div><div style={{color:col,fontSize:18,fontWeight:800,fontFamily:"monospace"}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:"flex",gap:14}}>
            <div style={{flex:2,minWidth:0}}>
              <Card style={{marginBottom:14}}>
                <CardTitle right={<Tag label={`${pnlHistory.length} pts`} dim/>}>Live P&L Curve â€” {POLL_MS/1000}s refresh</CardTitle>
                <PnLChart data={pnlHistory}/>
                <div style={{marginTop:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.sub,marginBottom:4}}><span>Daily Risk Used</span><span style={{color:pnl<-parseFloat(config.maxDailyLoss)*0.5?C.red:C.green,fontWeight:700}}>{Math.min(100,Math.abs(Math.min(0,pnl))/parseFloat(config.maxDailyLoss)*100).toFixed(1)}%</span></div>
                  <GaugeBar value={Math.abs(Math.min(0,pnl))} max={parseFloat(config.maxDailyLoss)||1000} color={pnl<-parseFloat(config.maxDailyLoss)*0.8?C.red:C.green}/>
                </div>
              </Card>
              <Card style={{marginBottom:14}}>
                <CardTitle right={lastBar?.time?<span style={{color:C.sub,fontSize:10}}>Updated {new Date(lastBar.time).toLocaleTimeString()}</span>:null}>NQ Futures â€” Live Market Bar</CardTitle>
                {lastBar?<div><div style={{display:"flex",gap:10,marginBottom:10}}>{[["O",lastBar.open,C.text],["H",lastBar.high,C.green],["L",lastBar.low,C.red],["C",lastBar.close,C.gold]].map(([k,v,col])=><div key={k} style={{flex:1,background:C.bg,borderRadius:6,padding:"8px 12px",textAlign:"center"}}><div style={{color:C.sub,fontSize:10,marginBottom:3}}>{k}</div><div style={{color:col,fontSize:15,fontFamily:"monospace",fontWeight:700}}>{Number(v||0).toFixed(2)}</div></div>)}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.sub}}><span>Vol: <span style={{color:C.text,fontFamily:"monospace"}}>{Number(lastBar.volume||0).toLocaleString()}</span></span><span>Interval: <span style={{color:C.accent}}>{lastBar.interval}m</span></span></div></div>:<div style={{textAlign:"center",padding:24,color:C.sub}}><div style={{fontSize:24,marginBottom:8}}>â³</div><div>Waiting for market data...</div></div>}
              </Card>
              <Card><CardTitle right={<Tag label={`${trades.length} trades`} dim/>}>Recent Executions</CardTitle>{trades.length===0?<div style={{color:C.sub,fontSize:12,textAlign:"center",padding:20}}>No trades this session</div>:trades.slice(0,10).map((t,i)=><TradeRow key={t.id||i} t={t}/>)}</Card>
            </div>
            <div style={{flex:1,minWidth:220}}>
              <Card style={{marginBottom:14}}>
                <CardTitle right={<span style={{color:C.sub,fontSize:10}}>auto {POLL_MS/1000}s</span>}>System Health</CardTitle>
                {[["Webhook Server",online_,"Port 5005"],["yfinance Stream",bars>0,"NQ=F 5m"],["LLM Engine",online_,config.ollamaModel],["Risk Manager",!halted,halted?"HALTED":"Active"],["EOD Scheduler",true,"15:55 ET"],["Serveo Tunnel",true,"profTowelBot"]].map(([l,a,d])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:7}}><Dot on={a} size={7}/><span style={{fontSize:12}}>{l}</span></div><span style={{color:C.sub,fontSize:10}}>{d}</span></div>
                ))}
              </Card>
              <Card style={{marginBottom:14}}><CardTitle>Kill Zone Clock</CardTitle><KZClock now={now}/></Card>
              <Card>
                <CardTitle>Quick Actions</CardTitle>
                <Btn onClick={sendTest} disabled={isTesting} full style={{marginBottom:8}}>{isTesting?"â³ Testing...":"ðŸ§ª Test Signal"}</Btn>
                {testResult&&<div style={{background:C.bg,border:`1px solid ${testResult.ok?C.green:C.red}44`,borderRadius:7,padding:8,fontSize:11,marginBottom:8}}><div style={{color:testResult.ok?C.green:C.red,fontWeight:700}}>{testResult.ok?`âœ… ${testResult.data?.status}`:`âŒ ${testResult.msg}`}</div></div>}
                <Btn onClick={sendFlatten} color={C.red} disabled={isFlattening} full>{isFlattening?"â³ Flattening...":"â›” Flatten All"}</Btn>
                {flatResult&&<div style={{marginTop:8,color:flatResult.ok?C.green:C.red,fontSize:12,fontWeight:700}}>{flatResult.ok?`âœ… ${flatResult.msg}`:`âŒ ${flatResult.msg}`}</div>}
              </Card>
            </div>
          </div>
        </div>}

        {/* TRADE */}
        {tab==="trade"&&<div style={{display:"flex",gap:14}}>
          <div style={{flex:1}}>
            <Card style={{marginBottom:14}}>
              <CardTitle>Manual Order Entry</CardTitle>
              <div style={{background:C.red+"15",border:`1px solid ${C.red}44`,borderRadius:7,padding:"8px 12px",marginBottom:14,fontSize:11,color:C.red}}>âš  Goes through Risk Manager. Topstep rules always apply.</div>
              <Row label="Symbol"><Input value={config.symbol} onChange={v=>setConfig(p=>({...p,symbol:v}))}/></Row>
              <Row label="Action"><div style={{display:"flex",gap:8}}>{["buy","sell"].map(a=><button key={a} onClick={()=>setManualAction(a)} style={{flex:1,background:manualAction===a?(a==="buy"?C.green:C.red)+"33":C.bg,border:`1px solid ${manualAction===a?(a==="buy"?C.green:C.red):C.border}`,color:manualAction===a?(a==="buy"?C.green:C.red):C.sub,borderRadius:6,padding:"6px",cursor:"pointer",fontWeight:700,fontSize:12,textTransform:"uppercase"}}>{a}</button>)}</div></Row>
              <Row label="Quantity"><Input value={manualQty} onChange={setManualQty} type="number"/></Row>
              <div style={{marginTop:14}}><Btn onClick={sendManual} color={manualAction==="buy"?C.green:C.red} full style={{padding:12}}>âš¡ {manualAction.toUpperCase()} {manualQty}x {config.symbol}</Btn></div>
              {manualResult&&<div style={{marginTop:10,background:C.bg,border:`1px solid ${manualResult.ok?C.green:C.red}44`,borderRadius:7,padding:10,fontSize:11}}><div style={{color:manualResult.ok?C.green:C.red,fontWeight:700}}>{manualResult.ok?`âœ… ${manualResult.data?.status}`:`âŒ ${manualResult.msg}`}</div></div>}
            </Card>
            <Card><CardTitle>Emergency</CardTitle><Btn onClick={sendFlatten} color={C.red} disabled={isFlattening} full style={{padding:12}}>{isFlattening?"â³ FLATTENING...":"â›” FLATTEN ALL â€” EMERGENCY STOP"}</Btn>{flatResult&&<div style={{marginTop:8,color:flatResult.ok?C.green:C.red,fontSize:12,fontWeight:700}}>{flatResult.ok?`âœ… ${flatResult.msg}`:`âŒ ${flatResult.msg}`}</div>}</Card>
          </div>
          <div style={{flex:1}}>
            <Card style={{marginBottom:14}}>
              <CardTitle>TradingView Webhook</CardTitle>
              <div style={{marginBottom:12}}><div style={{color:C.sub,fontSize:11,marginBottom:6}}>Webhook URL:</div><div style={{background:C.bg,border:`1px solid ${C.accent}44`,borderRadius:6,padding:10,color:C.accent,fontFamily:"monospace",fontSize:12,wordBreak:"break-all"}}>{config.tunnelUrl}/webhook</div></div>
              <div style={{color:C.sub,fontSize:11,marginBottom:6}}>Alert message:</div>
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:10}}><pre style={{color:C.text,fontSize:10,whiteSpace:"pre-wrap",margin:0,lineHeight:1.7}}>{`{\n  "secret": "${config.webhookSecret}",\n  "symbol": "{{ticker}}",\n  "action": "{{strategy.order.action}}",\n  "qty": 1,\n  "bar": {\n    "open": {{open}}, "high": {{high}},\n    "low": {{low}}, "close": {{close}},\n    "volume": {{volume}},\n    "time": "{{time}}",\n    "interval": "{{interval}}"\n  }\n}`}</pre></div>
            </Card>
            <Card><CardTitle right={<Tag label={`${trades.length} total`} dim/>}>Trade History</CardTitle>{trades.length===0?<div style={{color:C.sub,fontSize:12,padding:20,textAlign:"center"}}>No trades yet</div>:trades.map((t,i)=><TradeRow key={t.id||i} t={t}/>)}</Card>
          </div>
        </div>}

        {/* BACKTEST */}
        {tab==="backtest"&&<BacktesterPanel/>}

        {/* RISK */}
        {tab==="risk"&&<div style={{display:"flex",gap:14}}>
          <div style={{flex:1}}>
            <Card>
              <CardTitle>Topstep Rule Checker</CardTitle>
              {[{l:"Daily Loss Limit",v:`$${config.maxDailyLoss}`,ok:pnl>-parseFloat(config.maxDailyLoss),d:`Current: ${pnl>=0?"+":""}$${Number(pnl).toFixed(2)}`},{l:"Max Trailing Drawdown",v:`$${config.maxDrawdown}`,ok:true,d:"From peak"},{l:"Max Position Size",v:`${config.maxPosition} cts`,ok:true,d:"Per entry"},{l:"Trading Hours",v:`${config.tradingStart}â€“${config.tradingEnd} ET`,ok:true,d:"Hard gate"},{l:"EOD Flatten",v:"3:55 PM ET",ok:true,d:"No overnights"},{l:"Lunch Block",v:"12:00â€“12:59 ET",ok:true,d:"60%+ failure"},{l:"High Vol Gate",v:"ImpliedVol > 3%",ok:true,d:"FOMC/CPI"},{l:"Max Trades/Day",v:"4",ok:true,d:"Anti-overtrading"}].map(r=>(
                <div key={r.l} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:14,width:24,flexShrink:0}}>{r.ok?"âœ…":"â›”"}</span><div style={{flex:1}}><div style={{fontSize:12,color:r.ok?C.text:C.red}}>{r.l}</div><div style={{fontSize:10,color:C.sub}}>{r.d}</div></div><div style={{color:C.gold,fontFamily:"monospace",fontSize:13,fontWeight:700}}>{r.v}</div></div>
              ))}
            </Card>
          </div>
          <div style={{flex:1}}>
            <Card style={{marginBottom:14}}>
              <CardTitle>Account</CardTitle>
              <div style={{display:"flex",gap:10,marginBottom:14}}>{[["Starting","$50,000",C.sub],["Current",`$${Number(balance).toLocaleString()}`,C.gold]].map(([l,v,col])=><div key={l} style={{flex:1,background:C.bg,borderRadius:7,padding:12}}><div style={{color:C.sub,fontSize:10,marginBottom:4}}>{l}</div><div style={{color:col,fontFamily:"monospace",fontWeight:700,fontSize:16}}>{v}</div></div>)}</div>
              <div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:C.sub}}>Daily P&L</span><span style={{color:pnl>=0?C.green:C.red,fontFamily:"monospace",fontWeight:700}}>{pnl>=0?"+":""}${Number(pnl).toFixed(2)}</span></div><GaugeBar value={Math.abs(Math.min(0,pnl))} max={parseFloat(config.maxDailyLoss)||1000} color={pnl<-parseFloat(config.maxDailyLoss)*0.8?C.red:C.green}/></div>
              <div style={{display:"flex",gap:10}}>{[["STATUS",halted?"â›” HALTED":"âœ… ACTIVE",halted?C.red:C.green],["FIRM","TOPSTEP",C.gold],["PLATFORM","TRADOVATE",C.accent]].map(([l,v,col])=><div key={l} style={{flex:1,background:C.bg,borderRadius:7,padding:12,textAlign:"center"}}><div style={{color:C.sub,fontSize:9,marginBottom:4}}>{l}</div><div style={{color:col,fontWeight:800,fontSize:12}}>{v}</div></div>)}</div>
            </Card>
            <Card style={{marginBottom:14}}><CardTitle>Kill Zone Clock</CardTitle><KZClock now={now}/></Card>
            <Card><CardTitle>Emergency</CardTitle><Btn onClick={sendFlatten} color={C.red} disabled={isFlattening} full style={{padding:12}}>{isFlattening?"â³ FLATTENING...":"â›” FLATTEN ALL"}</Btn>{flatResult&&<div style={{marginTop:8,color:flatResult.ok?C.green:C.red,fontSize:12,fontWeight:700}}>{flatResult.ok?`âœ… ${flatResult.msg}`:`âŒ ${flatResult.msg}`}</div>}</Card>
          </div>
        </div>}

        {/* CONFIG */}
        {tab==="config"&&<div style={{display:"flex",gap:14}}>
          <div style={{flex:1}}>
            <Card style={{marginBottom:14}}>
              <CardTitle right={<span style={{color:C.sub,fontSize:10}}>Restart bot to apply</span>}>Trading Parameters</CardTitle>
              <Row label="Symbol"><Input value={config.symbol} onChange={v=>setConfig(p=>({...p,symbol:v}))}/></Row>
              <Row label="Max Daily Loss ($)"><Input value={config.maxDailyLoss} onChange={v=>setConfig(p=>({...p,maxDailyLoss:v}))} type="number"/></Row>
              <Row label="Max Drawdown ($)"><Input value={config.maxDrawdown} onChange={v=>setConfig(p=>({...p,maxDrawdown:v}))} type="number"/></Row>
              <Row label="Max Position"><Input value={config.maxPosition} onChange={v=>setConfig(p=>({...p,maxPosition:v}))} type="number"/></Row>
              <Row label="Trading Start ET"><Input value={config.tradingStart} onChange={v=>setConfig(p=>({...p,tradingStart:v}))}/></Row>
              <Row label="Trading End ET"><Input value={config.tradingEnd} onChange={v=>setConfig(p=>({...p,tradingEnd:v}))}/></Row>
              <Row label="Webhook Secret"><Input value={config.webhookSecret} onChange={v=>setConfig(p=>({...p,webhookSecret:v}))}/></Row>
              <Row label="Tunnel URL"><Input value={config.tunnelUrl} onChange={v=>setConfig(p=>({...p,tunnelUrl:v}))}/></Row>
            </Card>
          </div>
          <div style={{flex:1}}>
            <Card style={{marginBottom:14}}>
              <CardTitle>LLM Settings</CardTitle>
              <Row label="Ollama Model"><Input value={config.ollamaModel} onChange={v=>setConfig(p=>({...p,ollamaModel:v}))}/></Row>
              <Row label="Loop Interval (sec)"><Input value={config.loopInterval} onChange={v=>setConfig(p=>({...p,loopInterval:v}))} type="number"/></Row>
              <Row label="Min Confidence %"><Input value={config.minConfidence} onChange={v=>setConfig(p=>({...p,minConfidence:v}))} type="number"/></Row>
              <div style={{marginTop:12}}>{["deepseek-r1:7b","deepseek-r1:1.5b","gemma3:4b","llama3.2:3b"].map(m=><div key={m} onClick={()=>setConfig(p=>({...p,ollamaModel:m}))} style={{padding:"7px 10px",borderRadius:5,cursor:"pointer",marginBottom:4,background:config.ollamaModel===m?C.accent+"22":"transparent",border:`1px solid ${config.ollamaModel===m?C.accent:C.border}`,color:config.ollamaModel===m?C.accent:C.sub,fontSize:12,fontFamily:"monospace"}}>{m}</div>)}</div>
            </Card>
            <Card>
              <CardTitle>Start Commands</CardTitle>
              {[["Webhook","venv\\Scripts\\python.exe webhook_server.py"],["Bot","venv\\Scripts\\python.exe main.py"],["Scheduler","venv\\Scripts\\python.exe scheduler.py"],["Tunnel","ssh -R profTowelBot:80:localhost:5005 serveo.net"],["Trend Tracer BT","venv\\Scripts\\python.exe trend_tracer_backtester.py --symbol NQ=F --period 60d --interval 5m --all_hours"],["Renaissance BT","venv\\Scripts\\python.exe renaissance_backtester.py --symbol NQ=F --period 60d --interval 5m --all_hours"],["Breakout BT","venv\\Scripts\\python.exe breakout_sniper_backtester.py --symbol NQ=F --period 60d --interval 5m --all_hours"],["Dashboard","cd dashboard2 && set PORT=3001 && npm start"]].map(([l,cmd])=>(
                <div key={l} style={{marginBottom:10}}><div style={{color:C.sub,fontSize:10,marginBottom:4}}>{l}</div><div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",fontFamily:"monospace",fontSize:10,color:C.accent,wordBreak:"break-all"}}>{cmd}</div></div>
              ))}
            </Card>
          </div>
        </div>}

        {/* CONSOLE */}
        {tab==="console"&&<div>
          <Card style={{marginBottom:14}}>
            <CardTitle right={<Tag label={`${logs.length} entries`} dim/>}>Bot Activity Log â€” Live {POLL_MS/1000}s</CardTitle>
            <Console logs={logs}/>
          </Card>
          <div style={{display:"flex",gap:14}}>
            <Card style={{flex:1}}><CardTitle>Raw Status JSON</CardTitle><div style={{background:C.bg,borderRadius:7,padding:12,maxHeight:300,overflowY:"auto"}}><pre style={{color:C.sub,fontSize:11,margin:0,whiteSpace:"pre-wrap"}}>{data?JSON.stringify(data,null,2):"Waiting..."}</pre></div></Card>
            <Card style={{flex:1}}>
              <CardTitle>Connection</CardTitle>
              {[["API",API],["Status",online_?"Connected":"Offline"],["Latency",ping?`${ping}ms`:"â€”"],["Poll",`${POLL_MS/1000}s`],["Last Bar",lastBar?.close?`$${Number(lastBar.close).toFixed(2)}`:"â€”"],["Bars",bars],["Trades",trades.length]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}><span style={{color:C.sub}}>{k}</span><span style={{color:C.text,fontFamily:"monospace"}}>{v}</span></div>
              ))}
              <div style={{marginTop:14}}><Btn onClick={refresh} full>â†» Refresh Now</Btn></div>
            </Card>
          </div>
        </div>}

      </div>
      <div style={{textAlign:"center",padding:"14px 20px",borderTop:`1px solid ${C.border}`,color:C.muted,fontSize:10,letterSpacing:2,marginTop:20}}>
        Â© PROFESSORTOWEL AUTONOMOUS TRADING SYSTEM â€¢ NQ FUTURES â€¢ TOPSTEP â€¢ DEEPSEEK R1 + TRADOVATE
      </div>
    </div>
  );
}


