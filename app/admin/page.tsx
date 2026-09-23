'use client';
import { useState, useEffect } from 'react';

interface Voucher {
  id: number;
  giftCode: string;
  shippingCode: string;
  amount: number;
  isExchanged: boolean;
  memberPhone: string | null;
  exchangedAt: string | null;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchVouchers();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ADMIN_USER = 'admin96957662';
    const ADMIN_PASS = 'momentum96957662#e$!';

    if (usernameInput === ADMIN_USER && passwordInput === ADMIN_PASS) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError('');
      fetchVouchers();
    } else {
      setLoginError('帳號或密碼錯誤，請重新輸入');
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers');
      const data = await res.json();
      if (data.success) {
        setVouchers(data.vouchers);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('載入失敗');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportMessage('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/);
        const parsedData = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(',');
          if (cols.length >= 2) {
            parsedData.push({
              giftCode: cols[0]?.trim(),
              shippingCode: cols[1]?.trim(),
              amount: cols[2] ? Number(cols[2].trim()) : 100,
            });
          }
        }

        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvData: parsedData }),
        });

        const result = await res.json();
        setImportMessage(result.message);
        fetchVouchers();
      } catch (err) {
        setImportMessage('CSV 解析失敗，請檢查檔案格式是否正確');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (vouchers.length === 0) {
      alert('目前沒有資料可以匯出');
      return;
    }

    let csvContent = '\uFEFF';
    csvContent += '禮券序號,對應運費券,金額,兌換狀態,會員電話,兌換時間\n';

    vouchers.forEach((v) => {
      const status = v.isExchanged ? '已兌換' : '未兌換';
      const phone = v.memberPhone ? `\t${v.memberPhone}` : '-';
      const time = v.exchangedAt ? new Date(v.exchangedAt).toLocaleString('zh-TW') : '-';
      const row = `"${v.giftCode}","${v.shippingCode}",${v.amount},"${status}","${phone}","${time}"`;
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `voucher_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(vouchers.map((v) => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('請先勾選要刪除的項目');
      return;
    }

    if (!confirm(`確定要刪除選取的 ${selectedIds.length} 筆禮券資料嗎？此動作無法復原。`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchVouchers();
      } else {
        alert(data.message || '刪除失敗');
      }
    } catch (err) {
      alert('系統發生異常，刪除失敗');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">🔐 後台管理系統</h1>
            <p className="text-sm text-gray-500 mt-1">請登入以繼續操作</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-1 text-sm">管理員帳號</label>
              <input
                type="text"
                placeholder="請輸入帳號"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1 text-sm">管理員密碼</label>
              <input
                type="password"
                placeholder="請輸入密碼"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>

            {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-2"
            >
              登入後台
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-500 hover:underline">← 返回前台兌換頁面</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎁 禮券系統後台管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理與批次匯入禮券序號、即時檢視客戶兌換狀態</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/" target="_blank" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
              前往前台兌換頁面 ↗
            </a>
            <button 
              onClick={() => { sessionStorage.removeItem('admin_auth'); setIsAuthenticated(false); }}
              className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              登出
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <h2 className="text-lg font-bold text-gray-700 mb-2">📁 批次匯入禮券 (CSV 格式)</h2>
          <p className="text-sm text-gray-500 mb-4">
            CSV 欄位順序請依序為：<code className="bg-gray-100 px-2 py-1 rounded text-blue-600">giftCode, shippingCode, amount</code>（第一行為標題列可略過）。
          </p>
          
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          {loading && <p className="text-blue-600 text-sm mt-3 font-medium animate-pulse">正在批次匯入中，請稍候...</p>}
          {importMessage && <p className="text-green-700 bg-green-50 p-3 rounded-lg text-sm mt-3 font-bold border border-green-200">{importMessage}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-700">📊 所有禮券兌換清單 (共 {vouchers.length} 筆)</h2>
            
            <div className="flex flex-wrap items-center gap-3">
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>🗑️</span> 刪除選取項目 ({selectedIds.length})
                </button>
              )}

              <button 
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>📥</span> 匯出所有清單 (CSV)
              </button>
              
              <button onClick={fetchVouchers} className="text-sm text-blue-600 hover:underline font-medium">重新整理</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={vouchers.length > 0 && selectedIds.length === vouchers.length}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">禮券序號</th>
                  <th className="p-4">對應運費券</th>
                  <th className="p-4">金額</th>
                  <th className="p-4">兌換狀態</th>
                  <th className="p-4">會員電話</th>
                  <th className="p-4">兌換時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">目前沒有任何禮券資料，請透過上方 CSV 上傳匯入。</td>
                  </tr>
                ) : (
                  vouchers.map((v) => (
                    <tr key={v.id} className={`hover:bg-gray-50/50 ${selectedIds.includes(v.id) ? 'bg-blue-50/40' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(v.id)} 
                          onChange={() => handleSelectOne(v.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-800">{v.giftCode}</td>
                      <td className="p-4 font-mono text-blue-600">{v.shippingCode}</td>
                      <td className="p-4">${v.amount}</td>
                      <td className="p-4">
                        {v.isExchanged ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold">已兌換</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">未兌換</span>
                        )}
                      </td>
                      <td className="p-4 font-mono">{v.memberPhone || '-'}</td>
                      <td className="p-4 text-gray-500 text-xs">
                        {v.exchangedAt ? new Date(v.exchangedAt).toLocaleString('zh-TW') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}