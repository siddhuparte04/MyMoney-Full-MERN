import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, LayoutDashboard, ArrowLeftRight, Users, ChartNoAxesCombined, PiggyBank,
  Settings, Search, Bell, ChevronDown, ChevronLeft, ChevronRight, Plus, TrendingUp,
  TrendingDown, HandCoins, Target, Utensils, House, Shirt, Plane, CircleDollarSign,
  LogOut, Menu, X, RefreshCw, Trash2, Check, ArrowUpRight, Sparkles, CalendarDays
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend
} from 'recharts';
import { apiRequest, jsonBody } from './api';

const COLORS = ['#159b68', '#2884f4', '#f16b6b', '#ffb22c', '#8548d8', '#a2b0bf', '#bb5ca8'];
const DEFAULT_FIXED_SAVING_AMOUNT = 2000;
const FIXED_SAVING_CATEGORY = 'Fixed Monthly Saving';
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const today = () => new Date().toISOString().slice(0, 10);
const monthName = (date = new Date()) => date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const data = await apiRequest(`/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', body: jsonBody(form) });
      localStorage.setItem('mymoney_token', data.token);
      onAuth(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-wrap">
    <div className="auth-brand"><div className="brand-mark"><Wallet size={27}/></div><span>MyMoney</span><small>Plan · Track · Grow</small></div>
    <form className="auth-card" onSubmit={submit}>
      <div className="eyebrow">YOUR PERSONAL FINANCE SPACE</div>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="muted">Make every rupee work for you.</p>
      {mode === 'register' && <label>Full name<input name="name" value={form.name} onChange={update} placeholder="Your name" required /></label>}
      <label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required /></label>
      <label>Password<input name="password" type="password" minLength="8" value={form.password} onChange={update} placeholder="At least 8 characters" required /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <p className="auth-switch">{mode === 'login' ? 'New to MyMoney?' : 'Already have an account?'} <button type="button" className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
    </form>
    <p className="auth-foot">Your money, your plan. Built for better habits.</p>
  </div>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal">
    <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>{children}
  </div></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState('Dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState({ monthlySalary: 0, categories: [] });
  const [loans, setLoans] = useState([]);
  const [goals, setGoals] = useState([]);
  const [modal, setModal] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loanTab, setLoanTab] = useState('Borrowed');
  const [transactionForm, setTransactionForm] = useState({ date: today(), description: '', category: 'Food & Dining', amount: '', type: 'Expense', note: '' });
  const [loanForm, setLoanForm] = useState({ person: '', direction: 'Borrowed', amount: '', date: today(), dueDate: '', note: '' });
  const [goalForm, setGoalForm] = useState({ name: 'Emergency Fund', targetAmount: '', currentAmount: '0', targetDate: '' });
  const [repay, setRepay] = useState({ id: '', amount: '' });

  const loadData = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [s, t, b, l, g] = await Promise.all([
        apiRequest('/dashboard/summary'), apiRequest('/transactions'), apiRequest('/budget'),
        apiRequest('/loans'), apiRequest('/goals')
      ]);
      setSummary(s.summary); setTransactions(t.transactions || []);
      const loadedBudget = b.budget || { monthlySalary: 0, categories: [] };
      const loadedSalary = Math.max(0, Number(loadedBudget.monthlySalary) || 0);
      const loadedCategories = loadedBudget.categories || [];
      const fixedCategory = loadedCategories.find(category => category.name === FIXED_SAVING_CATEGORY);
      const fixedSavingAmount = Math.max(0, Number(fixedCategory?.amount ?? DEFAULT_FIXED_SAVING_AMOUNT) || 0);
      if (!fixedCategory && loadedSalary > fixedSavingAmount && loadedCategories.length) {
        const previousTotal = loadedCategories.reduce((sum, category) => sum + (Number(category.amount) || 0), 0);
        const available = loadedSalary - fixedSavingAmount;
        setBudget({
          ...loadedBudget,
          categories: [
            ...loadedCategories.map(category => ({
              ...category,
              amount: previousTotal > 0
                ? Number((((Number(category.amount) || 0) / previousTotal) * available).toFixed(2))
                : 0
            })),
            { name: FIXED_SAVING_CATEGORY, amount: fixedSavingAmount, color: '#8548d8' }
          ]
        });
      } else if (!fixedCategory) {
        setBudget({ ...loadedBudget, categories: [...loadedCategories, { name: FIXED_SAVING_CATEGORY, amount: fixedSavingAmount, color: '#8548d8' }] });
      } else {
        setBudget(loadedBudget);
      }
      setLoans(l.loans || []); setGoals(g.goals || []);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('mymoney_token');
    if (!token) { setAuthChecked(true); return; }
    apiRequest('/auth/me').then((data) => setUser(data.user)).catch(() => localStorage.removeItem('mymoney_token')).finally(() => setAuthChecked(true));
  }, []);
  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const flash = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 3000); };
  async function runAction(action, success) {
    try { await action(); await loadData(); setModal(''); flash(success); }
    catch (e) { setError(e.message); }
  }
  async function saveTransaction(e) {
    e.preventDefault();
    await runAction(() => apiRequest('/transactions', { method: 'POST', body: jsonBody({ ...transactionForm, amount: Number(transactionForm.amount) }) }), 'Transaction saved successfully.');
    setTransactionForm({ date: today(), description: '', category: 'Food & Dining', amount: '', type: 'Expense', note: '' });
  }
  async function saveLoan(e) {
    e.preventDefault();
    await runAction(() => apiRequest('/loans', { method: 'POST', body: jsonBody({ ...loanForm, amount: Number(loanForm.amount), dueDate: loanForm.dueDate || null }) }), 'Borrow / lend record saved.');
    setLoanForm({ person: '', direction: 'Borrowed', amount: '', date: today(), dueDate: '', note: '' });
  }
  async function saveBudget(e) {
    e.preventDefault();
    const fixedCategory = (budget.categories || []).find(c => c.name === FIXED_SAVING_CATEGORY);
    const fixedSavingAmount = Math.max(0, Number(fixedCategory?.amount ?? DEFAULT_FIXED_SAVING_AMOUNT) || 0);
    const variableCategories = (budget.categories || []).filter(c => c.name !== FIXED_SAVING_CATEGORY);
    const categoriesToSave = [
      ...variableCategories.map(c => ({ name: c.name, amount: Number(c.amount), color: c.color })),
      { name: FIXED_SAVING_CATEGORY, amount: fixedSavingAmount, color: '#8548d8' }
    ];
    await runAction(() => apiRequest('/budget', { method: 'PUT', body: jsonBody({ monthlySalary: Number(budget.monthlySalary), categories: categoriesToSave }) }), `Salary plan updated. ${money(fixedSavingAmount)} fixed monthly saving is included.`);
  }
  async function saveGoal(e) {
    e.preventDefault();
    await runAction(() => apiRequest('/goals', { method: 'POST', body: jsonBody({ ...goalForm, targetAmount: Number(goalForm.targetAmount), currentAmount: Number(goalForm.currentAmount || 0), targetDate: goalForm.targetDate || null }) }), 'Savings goal created.');
    setGoalForm({ name: 'Emergency Fund', targetAmount: '', currentAmount: '0', targetDate: '' });
  }
  async function deleteTransaction(id) { if (confirm('Delete this transaction?')) await runAction(() => apiRequest(`/transactions/${id}`, { method: 'DELETE' }), 'Transaction deleted.'); }
  async function deleteLoan(id) { if (confirm('Delete this borrow / lend record?')) await runAction(() => apiRequest(`/loans/${id}`, { method: 'DELETE' }), 'Record deleted.'); }
  async function deleteGoal(id) { if (confirm('Delete this savings goal?')) await runAction(() => apiRequest(`/goals/${id}`, { method: 'DELETE' }), 'Goal deleted.'); }
  async function submitRepayment(e) {
    e.preventDefault();
    await runAction(() => apiRequest(`/loans/${repay.id}/repayments`, { method: 'POST', body: jsonBody({ amount: Number(repay.amount), date: today() }) }), 'Repayment recorded.');
  }

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const savings = totalIncome - totalExpenses;
  const filteredTransactions = useMemo(() => transactions.filter(t => {
    const matchesType = filterType === 'All' || t.type === filterType;
    const q = search.toLowerCase();
    return matchesType && `${t.description} ${t.category} ${t.type}`.toLowerCase().includes(q);
  }), [transactions, filterType, search]);
  const expenseByCategory = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'Expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);
  const monthlyData = useMemo(() => {
    const rows = [];
    for (let back = 5; back >= 0; back--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - back);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTransactions = transactions.filter(t => String(t.date).slice(0, 7) === key);
      rows.push({ month: d.toLocaleDateString('en-IN', { month: 'short' }), Income: monthTransactions.filter(t => t.type === 'Income').reduce((a,t)=>a+t.amount,0), Expenses: monthTransactions.filter(t => t.type === 'Expense').reduce((a,t)=>a+t.amount,0) });
    }
    return rows;
  }, [transactions]);

  if (!authChecked) return <div className="loading-screen"><div className="spinner"/><p>Loading MyMoney…</p></div>;
  if (!user) return <AuthScreen onAuth={setUser}/>;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Salary Division', icon: Wallet },
    { label: 'Transactions', icon: ArrowLeftRight }, { label: 'Borrow & Lend', icon: Users },
    { label: 'Reports & Charts', icon: ChartNoAxesCombined }, { label: 'Savings Goals', icon: PiggyBank },
    { label: 'Settings', icon: Settings }
  ];
  const currentMonth = monthName();

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={25}/></div><div><strong>MyMoney</strong><small>Plan · Track · Grow</small></div><button className="mobile-close icon-btn" onClick={() => setMobileNav(false)}><X/></button></div>
      <nav>{navItems.map(item => <button key={item.label} className={`nav-item ${page === item.label ? 'active' : ''}`} onClick={() => { setPage(item.label); setMobileNav(false); }}><item.icon size={19}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><Sparkles size={19}/><p>Better money habits today, freedom tomorrow.</p><div className="wave">⌁⌁⌁</div></div>
    </aside>
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-btn" onClick={() => setMobileNav(true)}><Menu/></button>
        <div className="searchbox"><Search size={18}/><input placeholder="Search transactions, categories…" value={search} onChange={e => setSearch(e.target.value)}/></div>
        <div className="top-actions"><button className="icon-btn" title="Refresh data" onClick={loadData}><RefreshCw size={18}/></button><div className="avatar">{(user.name || 'U').slice(0,1).toUpperCase()}</div><div className="user-label"><strong>{user.name}</strong><small>{user.email}</small></div><button className="icon-btn" title="Sign out" onClick={() => { localStorage.removeItem('mymoney_token'); setUser(null); }}><LogOut size={18}/></button></div>
      </header>
      <div className="page-content">
        <div className="page-heading"><div><p className="eyebrow">{currentMonth.toUpperCase()} OVERVIEW</p><h1>{page === 'Dashboard' ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.name.split(' ')[0]}! 👋` : page}</h1><p className="muted">{page === 'Dashboard' ? 'Here’s your financial summary for this month.' : `Manage and understand your money — ${page.toLowerCase()}.`}</p></div><div className="month-pill"><CalendarDays size={17}/>{currentMonth}</div></div>
        {error && <div className="notice error-notice">{error}<button onClick={() => setError('')}><X size={16}/></button></div>}
        {notice && <div className="notice success-notice"><Check size={16}/>{notice}</div>}
        {busy && <div className="loading-line"><span/> Syncing your data…</div>}

        {page === 'Dashboard' && <Dashboard summary={summary} transactions={transactions} budget={budget} loans={loans} goals={goals} expenseByCategory={expenseByCategory} monthlyData={monthlyData} setPage={setPage} setModal={setModal} setTransactionForm={setTransactionForm} setLoanForm={setLoanForm} money={money} />}
        {page === 'Salary Division' && <BudgetPage budget={budget} setBudget={setBudget} onSave={saveBudget} money={money}/>}
        {page === 'Transactions' && <TransactionsPage transactions={filteredTransactions} filterType={filterType} setFilterType={setFilterType} search={search} setSearch={setSearch} setModal={setModal} setTransactionForm={setTransactionForm} onDelete={deleteTransaction} money={money}/>}
        {page === 'Borrow & Lend' && <LoansPage loans={loans} tab={loanTab} setTab={setLoanTab} setModal={setModal} setLoanForm={setLoanForm} setRepay={setRepay} onDelete={deleteLoan} money={money}/>}
        {page === 'Reports & Charts' && <ReportsPage monthlyData={monthlyData} expenseByCategory={expenseByCategory} transactions={transactions} money={money}/>}
        {page === 'Savings Goals' && <GoalsPage goals={goals} setModal={setModal} setGoalForm={setGoalForm} onDelete={deleteGoal} money={money}/>}
        {page === 'Settings' && <SettingsPage user={user} onLogout={() => { localStorage.removeItem('mymoney_token'); setUser(null); }}/>}
        <footer className="footer"><span>MyMoney · Personal Finance Manager</span><span>Build your dreams, one smart decision at a time. ♥</span></footer>
      </div>
    </main>

    {modal === 'transaction' && <Modal title="Add transaction" onClose={() => setModal('')}><form className="form-grid" onSubmit={saveTransaction}>
      <label>Type<select value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type:e.target.value})}><option>Expense</option><option>Income</option><option>Lent</option><option>Repayment</option></select></label>
      <label>Date<input type="date" value={transactionForm.date} onChange={e => setTransactionForm({...transactionForm, date:e.target.value})} required/></label>
      <label className="span-2">Description<input value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description:e.target.value})} placeholder="e.g. Monthly salary" required/></label>
      <label>Category<input value={transactionForm.category} onChange={e => setTransactionForm({...transactionForm, category:e.target.value})} placeholder="Food, Rent, Salary…" required/></label>
      <label>Amount (₹)<input type="number" min="0.01" step="0.01" value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount:e.target.value})} required/></label>
      <label className="span-2">Note (optional)<textarea value={transactionForm.note} onChange={e => setTransactionForm({...transactionForm, note:e.target.value})}/></label>
      <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setModal('')}>Cancel</button><button className="primary"><Plus size={16}/> Save transaction</button></div>
    </form></Modal>}
    {modal === 'loan' && <Modal title="Add borrow / lend record" onClose={() => setModal('')}><form className="form-grid" onSubmit={saveLoan}>
      <label>Direction<select value={loanForm.direction} onChange={e => setLoanForm({...loanForm,direction:e.target.value})}><option>Borrowed</option><option>Lent</option></select></label>
      <label>Amount (₹)<input type="number" min="0.01" step="0.01" value={loanForm.amount} onChange={e => setLoanForm({...loanForm,amount:e.target.value})} required/></label>
      <label className="span-2">Person<input value={loanForm.person} onChange={e => setLoanForm({...loanForm,person:e.target.value})} placeholder="Person's name" required/></label>
      <label>Date<input type="date" value={loanForm.date} onChange={e => setLoanForm({...loanForm,date:e.target.value})} required/></label>
      <label>Due date (optional)<input type="date" value={loanForm.dueDate} onChange={e => setLoanForm({...loanForm,dueDate:e.target.value})}/></label>
      <label className="span-2">Note<textarea value={loanForm.note} onChange={e => setLoanForm({...loanForm,note:e.target.value})}/></label>
      <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setModal('')}>Cancel</button><button className="primary">Save record</button></div>
    </form></Modal>}
    {modal === 'goal' && <Modal title="Create savings goal" onClose={() => setModal('')}><form className="form-grid" onSubmit={saveGoal}>
      <label className="span-2">Goal name<input value={goalForm.name} onChange={e => setGoalForm({...goalForm,name:e.target.value})} required/></label>
      <label>Target amount (₹)<input type="number" min="1" value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm,targetAmount:e.target.value})} required/></label>
      <label>Already saved (₹)<input type="number" min="0" value={goalForm.currentAmount} onChange={e => setGoalForm({...goalForm,currentAmount:e.target.value})}/></label>
      <label className="span-2">Target date (optional)<input type="date" value={goalForm.targetDate} onChange={e => setGoalForm({...goalForm,targetDate:e.target.value})}/></label>
      <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setModal('')}>Cancel</button><button className="primary">Create goal</button></div>
    </form></Modal>}
    {modal === 'repayment' && <Modal title="Record repayment" onClose={() => setModal('')}><form className="form-grid" onSubmit={submitRepayment}><label className="span-2">Repayment amount (₹)<input type="number" min="0.01" step="0.01" value={repay.amount} onChange={e => setRepay({...repay,amount:e.target.value})} required/></label><div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setModal('')}>Cancel</button><button className="primary">Record payment</button></div></form></Modal>}
  </div>;
}

function StatCard({ title, value, icon: Icon, tone, sub, trend }) {
  return <div className={`stat-card tone-${tone}`}><div className="stat-top"><div className="stat-icon"><Icon size={21}/></div><span className="stat-label">{title}</span></div><div className="stat-value">{value}</div><div className="stat-sub">{trend && <TrendingUp size={14}/>} {sub}</div></div>;
}
function Panel({ title, icon: Icon, action, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-head"><div className="panel-title">{Icon && <span className="panel-icon"><Icon size={18}/></span>}<h2>{title}</h2></div>{action}</div>{children}</section>;
}
function Dashboard({ summary, transactions, budget, loans, goals, expenseByCategory, monthlyData, setPage, setModal, setTransactionForm, setLoanForm, money }) {
  const totalIncome = summary?.totalIncome || 0, totalExpenses = summary?.totalExpenses || 0;
  const netBorrowed = loans.filter(l => l.direction === 'Borrowed').reduce((s,l)=>s+Math.max(0,l.amount-l.repayments.reduce((a,r)=>a+r.amount,0)),0);
  const netLent = loans.filter(l => l.direction === 'Lent').reduce((s,l)=>s+Math.max(0,l.amount-l.repayments.reduce((a,r)=>a+r.amount,0)),0);
  const categories = budget.categories || [];
  const firstGoal = goals[0];
  return <>
    <div className="stats-grid">
      <StatCard title="Total Income" value={money(totalIncome)} icon={Wallet} tone="green" sub={`${transactions.filter(t=>t.type==='Income').length} income records`} trend/>
      <StatCard title="Total Expenses" value={money(totalExpenses)} icon={CircleDollarSign} tone="red" sub={`${transactions.filter(t=>t.type==='Expense').length} expense records`}/>
      <StatCard title="Available Balance" value={money(totalIncome-totalExpenses)} icon={PiggyBank} tone="purple" sub="Income minus expenses" trend/>
      <StatCard title="Borrowed / Lent" value={money(netBorrowed+netLent)} icon={Users} tone="blue" sub={`Borrowed ${money(netBorrowed)} · Lent ${money(netLent)}`}/>
    </div>
    <div className="dashboard-grid two-col">
      <Panel title="Salary Division" icon={Wallet} action={<button className="link-button" onClick={()=>setPage('Salary Division')}>Edit plan <ArrowUpRight size={14}/></button>}>
        <div className="budget-chart-layout">
          <div className="donut-wrap"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={categories} dataKey="amount" nameKey="name" innerRadius={57} outerRadius={85} paddingAngle={2}>{categories.map((c,i)=><Cell key={c._id||c.name} fill={c.color||COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(budget.monthlySalary)}</strong><small>Monthly salary</small></div></div>
          <div className="category-list">{categories.map((c,i)=><div className="category-row" key={c._id||c.name}><span className="dot" style={{background:c.color||COLORS[i%COLORS.length]}}/><span className="category-name">{c.name}</span><strong>{money(c.amount)}</strong><small>{budget.monthlySalary ? Math.round(c.amount/budget.monthlySalary*100) : 0}%</small></div>)}</div>
        </div>
      </Panel>
      <Panel title="Monthly Spending Analysis" icon={ChartNoAxesCombined}>
        {expenseByCategory.length ? <div className="spending-layout"><div className="donut-wrap small-donut"><ResponsiveContainer width="100%" height={205}><PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2}>{expenseByCategory.map((c,i)=><Cell key={c.name} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(totalExpenses)}</strong><small>Total spent</small></div></div><div className="spend-legend">{expenseByCategory.slice(0,6).map((c,i)=><div key={c.name}><span className="dot" style={{background:COLORS[i%COLORS.length]}}/><span>{c.name}</span><strong>{totalExpenses?Math.round(c.value/totalExpenses*100):0}%</strong></div>)}</div></div> : <Empty text="Add expense transactions to see spending analysis."/>}
      </Panel>
    </div>
    <div className="dashboard-grid bottom-grid">
      <Panel title="Income vs Expenses" icon={ChartNoAxesCombined} className="chart-panel">
        <div className="chart-area"><ResponsiveContainer width="100%" height={235}><BarChart data={monthlyData} margin={{top:10,right:5,left:-15,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f3"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${v/1000}k`:v}/><Tooltip formatter={v=>money(v)}/><Legend/><Bar dataKey="Income" fill="#159b68" radius={[4,4,0,0]}/><Bar dataKey="Expenses" fill="#9be0bd" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="Savings Goal" icon={Target} action={<button className="link-button" onClick={()=>setPage('Savings Goals')}>View all</button>}>
        {firstGoal ? <div className="goal-preview"><h3>{firstGoal.name}</h3><div className="progress-track"><div style={{width:`${Math.min(100, firstGoal.currentAmount/firstGoal.targetAmount*100)}%`}}/></div><div className="progress-meta"><strong>{money(firstGoal.currentAmount)}</strong><span>of {money(firstGoal.targetAmount)}</span><b>{Math.round(firstGoal.currentAmount/firstGoal.targetAmount*100)}%</b></div><p className="muted small">Keep going — every rupee counts.</p></div> : <Empty text="Create a savings goal to track your progress." button="Create goal" onClick={()=>setModal('goal')}/>}
      </Panel>
      <Panel title="Quick Actions" icon={Sparkles}>
        <div className="quick-actions">
          <button className="quick green" onClick={()=>{setTransactionForm({date:today(),description:'',category:'Salary',amount:'',type:'Income',note:''});setModal('transaction')}}><span><Plus/></span>Add income</button>
          <button className="quick red" onClick={()=>{setTransactionForm({date:today(),description:'',category:'Food & Dining',amount:'',type:'Expense',note:''});setModal('transaction')}}><span><TrendingDown/></span>Add expense</button>
          <button className="quick blue" onClick={()=>{setLoanForm({person:'',direction:'Borrowed',amount:'',date:today(),dueDate:'',note:''});setModal('loan')}}><span><HandCoins/></span>Add borrow / lend</button>
          <button className="quick purple" onClick={()=>setPage('Salary Division')}><span><Wallet/></span>Manage budget</button>
        </div>
      </Panel>
    </div>
    <div className="dashboard-grid bottom-grid">
      <Panel title="Recent Transactions" icon={ArrowLeftRight} action={<button className="link-button" onClick={()=>setPage('Transactions')}>View all</button>} className="transactions-panel">
        <TransactionTable transactions={transactions.slice(0,6)} money={money}/>
      </Panel>
      <Panel title="Borrowed / Lent" icon={Users} action={<button className="link-button" onClick={()=>setPage('Borrow & Lend')}>View all</button>}>
        {loans.length ? <div className="compact-list">{loans.slice(0,4).map(l=><div className="compact-item" key={l._id}><div className="person-avatar">{l.person.slice(0,1).toUpperCase()}</div><div className="compact-main"><strong>{l.person}</strong><small>{l.direction} · {money(l.amount)}</small></div><span className={`status status-${l.status.toLowerCase().replace(' ','-')}`}>{l.status}</span></div>)}</div> : <Empty text="No borrow or lend records yet."/>}
      </Panel>
      <Panel title="Money Insights" icon={Sparkles}>
        <div className="insights"><div><span className="insight-icon green"><TrendingUp/></span><p>Your current balance is <strong>{money(totalIncome-totalExpenses)}</strong>.</p></div><div><span className="insight-icon orange"><Utensils/></span><p>You have tracked <strong>{transactions.length}</strong> transactions.</p></div><div><span className="insight-icon purple"><PiggyBank/></span><p><strong>{goals.length}</strong> savings goal(s) are in progress.</p></div></div>
      </Panel>
    </div>
  </>;
}
function Empty({text,button,onClick}) { return <div className="empty"><div className="empty-icon"><Sparkles size={21}/></div><p>{text}</p>{button&&<button className="secondary" onClick={onClick}>{button}</button>}</div>; }
function TransactionTable({ transactions, money, onDelete }) {
  if (!transactions.length) return <Empty text="No transactions yet. Add your income or first expense." />;
  return <div className="table-scroll"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Type</th>{onDelete&&<th></th>}</tr></thead><tbody>{transactions.map(t=><tr key={t._id}><td>{new Date(t.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td><td className="strong-cell">{t.description}</td><td>{t.category}</td><td className={t.type==='Expense'?'amount-negative':'amount-positive'}>{t.type==='Expense'?'− ':'+ '}{money(t.amount)}</td><td><span className={`type-pill ${t.type.toLowerCase()}`}>{t.type}</span></td>{onDelete&&<td><button className="icon-btn danger-btn" onClick={()=>onDelete(t._id)}><Trash2 size={15}/></button></td>}</tr>)}</tbody></table></div>;
}
function TransactionsPage({ transactions, filterType, setFilterType, search, setSearch, setModal, setTransactionForm, onDelete, money }) {
  return <><div className="toolbar"><div className="filter-tabs">{['All','Income','Expense','Lent','Repayment'].map(t=><button className={filterType===t?'selected':''} key={t} onClick={()=>setFilterType(t)}>{t}</button>)}</div><button className="primary" onClick={()=>{setTransactionForm({date:today(),description:'',category:'Food & Dining',amount:'',type:'Expense',note:''});setModal('transaction')}}><Plus size={17}/> Add transaction</button></div><Panel title={`${transactions.length} transaction(s)`} icon={ArrowLeftRight}><TransactionTable transactions={transactions} money={money} onDelete={onDelete}/></Panel></>;
}
function BudgetPage({ budget, setBudget, onSave, money }) {
  const salary = Math.max(0, Number(budget.monthlySalary) || 0);
  const allCategories = budget.categories || [];
  const categories = allCategories.filter(category => category.name !== FIXED_SAVING_CATEGORY);
  const fixedCategory = allCategories.find(category => category.name === FIXED_SAVING_CATEGORY);
  const fixedSaving = Math.max(0, Number(fixedCategory?.amount ?? DEFAULT_FIXED_SAVING_AMOUNT) || 0);
  const availableForDivision = Math.max(0, salary - fixedSaving);
  const variableTotal = categories.reduce((sum, category) => sum + (Number(category.amount) || 0), 0);
  const total = variableTotal + (salary >= fixedSaving ? fixedSaving : 0);
  const totalPercentage = availableForDivision > 0
    ? categories.reduce((sum, category) => sum + ((Number(category.amount) || 0) / availableForDivision) * 100, 0)
    : 0;
  const remaining = salary - total;

  function updateCategory(index, key, value) {
    const selectedCategory = categories[index];
    setBudget(current => ({
      ...current,
      categories: (current.categories || []).map(category => {
        if (category === selectedCategory || (selectedCategory?._id && category._id === selectedCategory._id)) {
          if (key === 'percentage') {
            const percentage = Math.max(0, Number(value) || 0);
            return { ...category, amount: Number(((availableForDivision * percentage) / 100).toFixed(2)) };
          }
          return { ...category, [key]: value };
        }
        return category;
      })
    }));
  }

  function updateSalary(value) {
    const nextSalary = Math.max(0, Number(value) || 0);
    const nextAvailable = Math.max(0, nextSalary - fixedSaving);
    const oldAvailable = Math.max(0, salary - fixedSaving);
    setBudget(current => ({
      ...current,
      monthlySalary: value,
      categories: (current.categories || []).map(category => {
        if (category.name === FIXED_SAVING_CATEGORY) return { ...category, color: category.color || '#8548d8' };
        const oldAmount = Number(category.amount) || 0;
        const percentage = oldAvailable > 0 ? (oldAmount / oldAvailable) * 100 : 0;
        return { ...category, amount: Number(((nextAvailable * percentage) / 100).toFixed(2)) };
      })
    }));
  }

  function updateFixedSaving(value) {
    const nextFixed = Math.max(0, Number(value) || 0);
    const nextAvailable = Math.max(0, salary - nextFixed);
    const oldAvailable = Math.max(0, salary - fixedSaving);
    setBudget(current => {
      const existing = current.categories || [];
      const variableCategories = existing.filter(category => category.name !== FIXED_SAVING_CATEGORY).map(category => {
        const oldAmount = Number(category.amount) || 0;
        const percentage = oldAvailable > 0 ? oldAmount / oldAvailable : 0;
        return { ...category, amount: Number((nextAvailable * percentage).toFixed(2)) };
      });
      return {
        ...current,
        categories: [...variableCategories, { ...(existing.find(category => category.name === FIXED_SAVING_CATEGORY) || {}), name: FIXED_SAVING_CATEGORY, amount: nextFixed, color: '#8548d8' }]
      };
    });
  }

  function addCategory() {
    setBudget(current => ({
      ...current,
      categories: [
        ...(current.categories || []).filter(category => category.name !== FIXED_SAVING_CATEGORY),
        { name: 'New category', amount: 0, color: COLORS[(categories.length) % COLORS.length] },
        ...(current.categories || []).filter(category => category.name === FIXED_SAVING_CATEGORY)
      ]
    }));
  }

  function removeCategory(index) {
    const selectedCategory = categories[index];
    setBudget(current => ({
      ...current,
      categories: (current.categories || []).filter(category =>
        category !== selectedCategory && !(selectedCategory?._id && category._id === selectedCategory._id)
      )
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (salary < fixedSaving) {
      window.alert(`Your monthly salary must be at least ${money(fixedSaving)} to cover your fixed saving.`);
      return;
    }
    if (!categories.length) {
      window.alert('Please add at least one category for the remaining salary.');
      return;
    }
    if (categories.some(category => !String(category.name || '').trim())) {
      window.alert('Please enter a name for every category.');
      return;
    }
    if (Math.abs(totalPercentage - 100) > 0.05) {
      window.alert(`The percentages for the remaining salary must total 100%. Current total: ${totalPercentage.toFixed(2)}%.`);
      return;
    }
    onSave(event);
  }

  return <div className="single-column">
    <Panel title="Divide your monthly salary" icon={Wallet}>
      <form onSubmit={handleSubmit}>
        <div className="salary-input-row">
          <label>
            Monthly salary received (₹)
            <input type="number" min="1" step="0.01" value={budget.monthlySalary ?? ''} onChange={event => updateSalary(event.target.value)} required />
          </label>
          <div className="budget-summary">
            <small>Total allocated</small>
            <strong>{money(total)}</strong>
            <span className={remaining < -0.01 ? 'over-budget' : ''}>
              {money(Math.abs(remaining))} {remaining >= -0.01 ? 'left' : 'over budget'}
            </span>
          </div>
        </div>

        <div className="callout" style={{ marginBottom: 18 }}>
          <PiggyBank size={22} />
          <div>
            <strong>Fixed monthly saving</strong>
            <p>Choose how much you want to reserve every month. The remaining {money(availableForDivision)} will be divided across the categories below.</p>
            <label style={{ display: 'block', maxWidth: 240, marginTop: 10 }}>Monthly fixed saving (₹)
              <input type="number" min="0" step="0.01" max={salary} value={fixedSaving} onChange={event => updateFixedSaving(event.target.value)} required />
            </label>
          </div>
        </div>

        <div className="budget-category-editor">
          {categories.map((category, index) => {
            const percentage = availableForDivision > 0 ? ((Number(category.amount) || 0) / availableForDivision) * 100 : 0;
            return <div className="budget-edit-row" key={category._id || `${category.name}-${index}`}>
              <span className="dot" style={{ background: category.color || COLORS[index % COLORS.length] }} />
              <input aria-label="Category name" value={category.name || ''} onChange={event => updateCategory(index, 'name', event.target.value)} placeholder="e.g. Family, Grooming, Friend" required />
              <label className="percentage-input">
                <span>Percent of remaining</span>
                <div className="money-input">
                  <input aria-label={`Percentage for ${category.name || `category ${index + 1}`}`} type="number" min="0" max="100" step="0.01" value={Number(percentage.toFixed(2))} onChange={event => updateCategory(index, 'percentage', event.target.value)} required />
                  <span>%</span>
                </div>
              </label>
              <div className="calculated-amount"><small>Amount</small><strong>{money(category.amount)}</strong></div>
              <button type="button" className="icon-btn danger-btn" aria-label={`Remove ${category.name || 'category'}`} onClick={() => removeCategory(index)}><Trash2 size={16} /></button>
            </div>;
          })}
        </div>

        <div className="budget-footer">
          <button type="button" className="secondary" onClick={addCategory}><Plus size={16} /> Add category</button>
          <button className="primary" type="submit"><Check size={16} /> Save salary plan</button>
        </div>
      </form>
    </Panel>

    <div className="callout">
      <Sparkles size={21} />
      <div>
        <strong>Save first, spend mindfully.</strong>
        <p>Your ₹2,000 fixed saving is reserved first. The remaining salary is divided by percentage, and those percentages must add up to 100% before you can save the plan.</p>
      </div>
    </div>
  </div>;
}
function LoansPage({ loans, tab, setTab, setModal, setLoanForm, setRepay, onDelete, money }) {
  const rows = loans.filter(l=>l.direction===tab);
  const balance = rows.reduce((s,l)=>s+Math.max(0,l.amount-l.repayments.reduce((a,r)=>a+r.amount,0)),0);
  return <><div className="toolbar"><div className="filter-tabs"><button className={tab==='Borrowed'?'selected':''} onClick={()=>setTab('Borrowed')}>Borrowed</button><button className={tab==='Lent'?'selected':''} onClick={()=>setTab('Lent')}>Lent</button></div><button className="primary" onClick={()=>{setLoanForm({person:'',direction:tab,amount:'',date:today(),dueDate:'',note:''});setModal('loan')}}><Plus size={17}/> Add record</button></div><div className="stats-grid two-stats"><StatCard title={`${tab} outstanding`} value={money(balance)} icon={HandCoins} tone="blue" sub={`${rows.length} record(s)`}/><StatCard title="Completed records" value={rows.filter(l=>l.status==='Completed').length} icon={Check} tone="green" sub="Fully repaid"/></div><Panel title={`${tab} records`} icon={Users}>{rows.length ? <div className="loan-list">{rows.map(l=>{const repaid=l.repayments.reduce((s,r)=>s+r.amount,0);const remaining=Math.max(0,l.amount-repaid);return <div className="loan-row" key={l._id}><div className="person-avatar large">{l.person.slice(0,1).toUpperCase()}</div><div className="loan-main"><div className="loan-title"><strong>{l.person}</strong><span className={`status status-${l.status.toLowerCase().replace(' ','-')}`}>{l.status}</span></div><p>{l.note||`${tab} on ${new Date(l.date).toLocaleDateString('en-IN')}`}</p><div className="progress-track slim"><div style={{width:`${Math.min(100,repaid/l.amount*100)}%`}}/></div><small>{money(repaid)} repaid · {money(remaining)} outstanding</small></div><div className="loan-amount"><strong>{money(l.amount)}</strong>{remaining>0&&<button className="small-action" onClick={()=>{setRepay({id:l._id,amount:''});setModal('repayment')}}>Record payment</button>}<button className="icon-btn danger-btn" onClick={()=>onDelete(l._id)}><Trash2 size={15}/></button></div></div>})}</div>:<Empty text={`No ${tab.toLowerCase()} records yet.`} button="Add record" onClick={()=>{setLoanForm({person:'',direction:tab,amount:'',date:today(),dueDate:'',note:''});setModal('loan')}}/>}</Panel></>;
}
function ReportsPage({ monthlyData, expenseByCategory, transactions, money }) {
  const income=transactions.filter(t=>t.type==='Income').reduce((s,t)=>s+t.amount,0), expenses=transactions.filter(t=>t.type==='Expense').reduce((s,t)=>s+t.amount,0);
  return <><div className="stats-grid"><StatCard title="Total income" value={money(income)} icon={TrendingUp} tone="green" sub="All recorded income"/><StatCard title="Total expenses" value={money(expenses)} icon={TrendingDown} tone="red" sub="All recorded expenses"/><StatCard title="Net balance" value={money(income-expenses)} icon={PiggyBank} tone="purple" sub="Income minus expenses"/><StatCard title="Savings rate" value={`${income?Math.round((income-expenses)/income*100):0}%`} icon={Target} tone="blue" sub="Based on recorded income"/></div><div className="dashboard-grid two-col"><Panel title="Income vs expenses — last 6 months" icon={ChartNoAxesCombined}><div className="chart-area tall"><ResponsiveContainer width="100%" height={310}><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis tickFormatter={v=>v>=1000?`${v/1000}k`:v}/><Tooltip formatter={v=>money(v)}/><Legend/><Bar dataKey="Income" fill="#159b68" radius={[4,4,0,0]}/><Bar dataKey="Expenses" fill="#9be0bd" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></Panel><Panel title="Expenses by category" icon={CircleDollarSign}>{expenseByCategory.length?<><div className="chart-area"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={90} label>{expenseByCategory.map((x,i)=><Cell key={x.name} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>money(v)}/></PieChart></ResponsiveContainer></div><div className="category-list">{expenseByCategory.map((x,i)=><div className="category-row" key={x.name}><span className="dot" style={{background:COLORS[i%COLORS.length]}}/><span className="category-name">{x.name}</span><strong>{money(x.value)}</strong></div>)}</div></>:<Empty text="Add expenses to build your report."/ >}</Panel></div><Panel title="All transactions" icon={ArrowLeftRight}><TransactionTable transactions={transactions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date))} money={money}/></Panel></>;
}
function GoalsPage({ goals, setModal, setGoalForm, onDelete, money }) {
  return <><div className="toolbar"><p className="muted">Small steps today lead to bigger savings tomorrow.</p><button className="primary" onClick={()=>{setGoalForm({name:'',targetAmount:'',currentAmount:'0',targetDate:''});setModal('goal')}}><Plus size={17}/> Create goal</button></div>{goals.length?<div className="goals-grid">{goals.map(g=>{const pct=Math.min(100,Math.round(g.currentAmount/g.targetAmount*100));return <div className="goal-card" key={g._id}><div className="goal-card-top"><div className="goal-badge"><Target/></div><button className="icon-btn danger-btn" onClick={()=>onDelete(g._id)}><Trash2 size={16}/></button></div><h2>{g.name}</h2><p className="muted">Savings target</p><div className="goal-amount">{money(g.currentAmount)} <span>of {money(g.targetAmount)}</span></div><div className="progress-track"><div style={{width:`${pct}%`}}/></div><div className="progress-meta"><span>{pct}% complete</span><strong>{money(Math.max(0,g.targetAmount-g.currentAmount))} to go</strong></div>{g.targetDate&&<p className="goal-date"><CalendarDays size={14}/> Target {new Date(g.targetDate).toLocaleDateString('en-IN')}</p>}</div>})}</div>:<Panel title="Your savings goals" icon={Target}><Empty text="Create your first savings goal, such as an emergency fund or a new laptop." button="Create goal" onClick={()=>{setGoalForm({name:'Emergency Fund',targetAmount:'',currentAmount:'0',targetDate:''});setModal('goal')}}/></Panel>}</>;
}
function SettingsPage({ user, onLogout }) {
  return <div className="single-column"><Panel title="Account settings" icon={Settings}><div className="profile-settings"><div className="avatar big">{(user.name||'U').slice(0,1).toUpperCase()}</div><div><h2>{user.name}</h2><p className="muted">{user.email}</p><span className="status status-completed">Account active</span></div></div><div className="settings-note"><strong>Data and privacy</strong><p>Your finance records are stored in MongoDB and associated with your authenticated account. Keep your password private and do not share your login token.</p></div><button className="danger-outline" onClick={onLogout}><LogOut size={17}/> Sign out</button></Panel></div>;
}

export default App;