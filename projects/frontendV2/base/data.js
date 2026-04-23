// Mock data for the analytics platform
(function(){
  const FIRST = ["Maya","Arjun","Priya","Diego","Sofia","Kenji","Amara","Luca","Noor","Ravi","Elena","Tariq","Yuki","Mateo","Aisha","Finn","Zara","Omar","Isla","Kai","Nadia","Theo","Liv","Samir","Esha","Jonah","Mila","Ivo","Rhea","Dax","Nia","Bodhi","Suri","Quinn","Aria","Leo","Maris","Odin","Sana","Vik","Wren","Cleo","Jax","Ines","Remy","Anya","Cruz","Ember","Fable","Gio"];
  const LAST = ["Chen","Patel","Okafor","Navarro","Kowalski","Tanaka","Jensen","Ferrari","Silva","Hassan","Reyes","Kim","Bauer","Dubois","Rossi","Nakamura","Mbeki","Alvarez","Schmidt","Ito","Park","Abadi","Moretti","Singh","Vargas","Ng","Hoffman","Costa","Lund","Ozturk"];
  const DEPTS = ["Engineering","Product","Design","Data","Growth","Ops","People","Finance"];
  const LEVELS = ["L2","L3","L4","L5","L6","L7"];
  const LOC = ["SF","NYC","Remote","Berlin","Lisbon","Toronto","Mexico City","Tokyo"];
  const TITLES = {
    Engineering:["Software Engineer","Senior Engineer","Staff Engineer","Engineering Manager","Platform Engineer","ML Engineer"],
    Product:["Product Manager","Senior PM","Group PM","Principal PM"],
    Design:["Product Designer","Senior Designer","Design Lead","Brand Designer"],
    Data:["Data Scientist","Analytics Engineer","ML Scientist","Data Engineer"],
    Growth:["Growth Marketer","Growth PM","Content Lead","SEO Specialist"],
    Ops:["Operations Manager","Business Ops","Support Engineer","IT Admin"],
    People:["Recruiter","People Partner","People Ops","Talent Lead"],
    Finance:["Financial Analyst","Controller","FP&A Lead","Accountant"]
  };
  // Deterministic PRNG so the mock is stable across reloads
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
  const rand = mulberry32(42);
  const pick = arr => arr[Math.floor(rand()*arr.length)];
  const round = (n,s=1) => Math.round(n/s)*s;

  const EMPLOYEES = [];
  const N = 54;
  for(let i=0;i<N;i++){
    const dept = pick(DEPTS);
    const level = LEVELS[Math.min(5, Math.floor(rand()*6))];
    const first = pick(FIRST);
    const last = pick(LAST);
    const baseByLevel = {L2:85000,L3:115000,L4:150000,L5:185000,L6:225000,L7:285000}[level];
    const salary = round(baseByLevel + (rand()-0.5)*30000, 500);
    const startYear = 2019 + Math.floor(rand()*7);
    const startMonth = 1 + Math.floor(rand()*12);
    EMPLOYEES.push({
      id: "E"+(1000+i),
      name: first+" "+last,
      initials: first[0]+last[0],
      email: (first+"."+last).toLowerCase()+"@lumen.co",
      dept,
      title: pick(TITLES[dept]),
      level,
      location: pick(LOC),
      salary,
      startDate: `${startYear}-${String(startMonth).padStart(2,'0')}-01`,
      status: rand() > 0.05 ? "Active" : "On leave",
      perf: ["Meets","Exceeds","Exceeds","Outstanding","Meets"][Math.floor(rand()*5)]
    });
  }

  // Monthly payroll (last 12 months) & headcount
  const MONTHS = ["May '25","Jun '25","Jul '25","Aug '25","Sep '25","Oct '25","Nov '25","Dec '25","Jan '26","Feb '26","Mar '26","Apr '26"];
  const headcountSeries = [];
  const payrollSeries = [];
  let hc = 38;
  for(let i=0;i<12;i++){
    hc += Math.floor(rand()*3); // grow
    headcountSeries.push(hc);
    // avg monthly salary cost ~ hc * avg-monthly
    const avgMonthly = 13800 + Math.floor(rand()*1200);
    payrollSeries.push(hc * avgMonthly);
  }

  // Department breakdown
  const byDept = {};
  DEPTS.forEach(d=>byDept[d]=0);
  EMPLOYEES.forEach(e=>byDept[e.dept]++);
  const deptData = Object.entries(byDept).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);

  // Salary distribution by level
  const salaryByLevel = LEVELS.map(lvl=>{
    const rows = EMPLOYEES.filter(e=>e.level===lvl);
    const avg = rows.length? rows.reduce((s,e)=>s+e.salary,0)/rows.length : 0;
    return { level: lvl, avg: Math.round(avg), count: rows.length };
  });

  window.__DATA = {
    EMPLOYEES, MONTHS, headcountSeries, payrollSeries, deptData, salaryByLevel, DEPTS, LOC, LEVELS
  };
})();
