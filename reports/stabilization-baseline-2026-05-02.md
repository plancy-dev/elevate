# Stabilization Baseline (2026-05-02)

## Purpose

Pre-fix baseline snapshot for STAB tickets (`#49`-`#54`) before any stabilization implementation begins.

## Baseline Metrics

### Publish Failure (7d)

- publish total: `19`
- publish failed: `12`
- publish fail ratio: `63.2%`
- `resend_not_configured`: `10`
- `retry_exhausted`: `0` (in this exact 7d publication row filter)

### Quality Signals (7d)

- `low_novelty` review-required count: `6`
- `citationCoverage7dAvg`: `0`
- quality monitor top quality issue: `low_novelty (11)`

### Quality Monitor Snapshot (7d/24h)

From `pnpm tsx scripts/content-ops-quality-monitor.ts`:

- generatedCount: `24`
- publishedCount: `8`
- reviewRequiredCount: `8`
- sendFailedCount: `7`
- citationCoverage7dAvg: `0`
- avgQualityScore: `19.1`
- freshGeneratedCount: `22`
- freshReviewRequiredCount: `7`
- citationCoverage24hAvg: `0`
- freshAvgQualityScore: `20`

## Commands Used

```bash
pnpm tsx scripts/content-ops-quality-monitor.ts
```

```bash
pnpm tsx -e "import dotenv from 'dotenv'; dotenv.config({path:'.env.local'}); import { createClient } from '@supabase/supabase-js'; (async () => { const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}}); const since7=new Date(Date.now()-7*24*60*60*1000).toISOString(); const [{data:pub,error:pubErr},{data:items,error:itemErr}] = await Promise.all([s.from('content_publications').select('status,last_error,processed_at').eq('channel','email').gte('processed_at',since7), s.from('content_items').select('status,type,created_at,metadata').gte('created_at',since7)]); if(pubErr) throw pubErr; if(itemErr) throw itemErr; const pubs=pub??[]; const publishTotal=pubs.length; const publishFailed=pubs.filter((r:any)=>r.status==='failed').length; const publishFailRatio=publishTotal?Number(((publishFailed/publishTotal)*100).toFixed(1)):0; const retryExhausted=pubs.filter((r:any)=>String(r.last_error??'').toLowerCase().includes('retry_exhausted')).length; const resendNotConfigured=pubs.filter((r:any)=>String(r.last_error??'').toLowerCase().includes('resend_not_configured')).length; const citems=items??[]; const recentLowNovelty=citems.filter((r:any)=>r.status==='review_required' && JSON.stringify((r as any).metadata??{}).includes('low_novelty')).length; const citationVals:number[]=[]; for(const r of citems as any[]){ const c=(r.metadata as any)?.reviewGate?.metrics?.citationCoverage; if(typeof c==='number' && Number.isFinite(c)) citationVals.push(c);} const citationCoverage7dAvg=citationVals.length?Number((citationVals.reduce((a,b)=>a+b,0)/citationVals.length).toFixed(2)):0; console.log(JSON.stringify({windowDays:7,publish:{total:publishTotal,failed:publishFailed,failRatioPercent:publishFailRatio,retryExhausted,resendNotConfigured},quality:{lowNoveltyReviewRequiredCount:recentLowNovelty,citationCoverage7dAvg}},null,2)); })();"
```
