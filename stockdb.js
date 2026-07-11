// 投資標的資料庫（用於問卷推薦）
// tags: growth=成長股, value=價值股, dividend=高殖利率, stable=防禦穩健, tech=科技, traditional=傳統產業, esg=永續
// per: 最近一季本益比（FinMind 公開資料，2026-07-11 快照，僅供同業基準參照）
const STOCK_DB = [
    { code:'2330', name:'台積電', industry:'半導體業', per:32.47, tags:['growth','tech','stable','value'] },
    { code:'2317', name:'鴻海',   industry:'電子零組件業', per:16.87, tags:['value','dividend','stable','tech'] },
    { code:'2454', name:'聯發科', industry:'半導體業', per:62.55, tags:['growth','tech'] },
    { code:'2308', name:'台達電', industry:'電子零組件業', per:69.32, tags:['growth','stable','esg','tech'] },
    { code:'2881', name:'富邦金', industry:'金融業',   per:17.13, tags:['dividend','value','stable'] },
    { code:'2882', name:'國泰金', industry:'金融業',   per:14.61, tags:['dividend','value','stable'] },
    { code:'2886', name:'兆豐金', industry:'金融業',   per:18.98, tags:['dividend','stable','value'] },
    { code:'2002', name:'中鋼',   industry:'鋼鐵工業', per:0, tags:['traditional','value','dividend'] },
    { code:'1301', name:'台塑',   industry:'塑膠工業', per:0, tags:['traditional','dividend','value','stable'] },
    { code:'1303', name:'南亞',   industry:'塑膠工業', per:78.57, tags:['traditional','dividend','value'] },
    { code:'2412', name:'中華電', industry:'通信網路業', per:26.54, tags:['dividend','stable','esg'] },
    { code:'6505', name:'台塑化', industry:'石油煤製品', per:21.08, tags:['traditional','dividend','value'] },
    { code:'3008', name:'大立光', industry:'光電業',   per:24.66, tags:['growth','tech','value'] },
    { code:'2382', name:'廣達',   industry:'電腦及週邊設備業', per:18.78, tags:['growth','tech','dividend'] },
    { code:'2891', name:'中信金', industry:'金融業',   per:16.84, tags:['dividend','value','stable'] }
];

function recommend(answers) {
    // answers: { age, horizon, risk, income, industry }
    const score = {};
    STOCK_DB.forEach(s => score[s.code] = 0);

    // 風險承受度
    const riskMap = { conservative:['dividend','stable'], moderate:['value','stable','dividend','growth'], aggressive:['growth','tech'] };
    const wantTags = riskMap[answers.risk] || [];

    // 收益偏好（重視殖利率）
    if (answers.income === 'yes') wantTags.push('dividend','stable');

    // 產業偏好
    const indMap = {
        tech:['tech'], finance:['dividend','stable'], traditional:['traditional'],
        any:[], esg:['esg']
    };
    if (answers.industry && indMap[answers.industry]) wantTags.push(...indMap[answers.industry]);

    // 年齡：年長者偏好穩健
    if (answers.age === 'old') wantTags.push('stable','dividend');
    if (answers.age === 'young') wantTags.push('growth','tech');

    // 期限：長期可承受成長波動
    if (answers.horizon === 'long') wantTags.push('growth','value');
    if (answers.horizon === 'short') wantTags.push('stable');

    STOCK_DB.forEach(s => { s.tags.forEach(t => { if (wantTags.includes(t)) score[s.code] += 1; }); });

    const ranked = STOCK_DB.map(s => ({ ...s, score: score[s.code] }))
        .filter(s => s.score > 0)
        .sort((a,b) => b.score - a.score)
        .slice(0, 5);

    return ranked;
}
