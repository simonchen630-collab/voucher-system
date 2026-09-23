'use client';
import { useState } from 'react';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    isAlreadyExchanged?: boolean; 
    message?: string; 
    shippingCode?: string 
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length !== 10 || !phone.startsWith('09')) {
      alert('請輸入有效的手機號碼 (10碼)');
      return;
    }
    if (!giftCode) {
      alert('請輸入禮券序號');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setIsCopied(false);

    try {
      const response = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftCode, memberPhone: phone }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ 
          success: true, 
          isAlreadyExchanged: data.isAlreadyExchanged, 
          shippingCode: data.shippingCode,
          message: data.message 
        });
      } else {
        setResult({ success: false, message: data.message });
      }
    } catch (error) {
      setResult({ success: false, message: '系統連線發生錯誤，請稍後再試' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.shippingCode) {
      try {
        await navigator.clipboard.writeText(result.shippingCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        alert('複製失敗，請手動長按選取複製');
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        
        {/* LOGO 與系統標題（已放大寬度與字體） */}
        <div className="flex flex-col items-center mb-8">
          <img src="/NBA_Store_LOGO.png" alt="NBA Store Logo" className="w-1/2 object-contain mb-3" />
          <h2 className="text-xl font-extrabold text-gray-800 tracking-wider">運費券兌換系統</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">會員電話</label>
            <input
              type="tel"
              maxLength={10}
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full text-lg px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">禮券序號</label>
            <input
              type="text"
              placeholder="請輸入序號 (區分大小寫)"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value.trim())}
              className="w-full text-lg px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoCapitalize="off"
              autoComplete="off"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 rounded-lg transition-colors disabled:bg-slate-500"
          >
            {isLoading ? '處理中...' : '確認送出'}
          </button>
        </form>

        {/* ================= API 結果顯示區塊 ================= */}
        {result && (
          <div className={`mt-6 p-5 rounded-lg border text-center ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.success ? (
              <div>
                {result.isAlreadyExchanged ? (
                  <div className="mb-3">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      ⚠️ 此券先前已兌換過（僅供查詢）
                    </span>
                    <p className="text-gray-600 text-sm mt-2">您的運費券序號如下：</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-green-700 font-bold text-lg mb-2">🎉 兌換成功！</h3>
                    <p className="text-gray-600 text-sm mb-3">請妥善保管您的運費券序號：</p>
                  </div>
                )}
                
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 bg-white border-2 border-green-400 text-green-600 font-mono text-xl sm:text-2xl font-bold py-2 rounded-md tracking-wider flex items-center justify-center select-all">
                    {result.shippingCode}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-md font-bold text-white transition-colors whitespace-nowrap ${
                      isCopied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isCopied ? '已複製!' : '複製'}
                  </button>
                </div>

              </div>
            ) : (
              <p className="text-red-600 font-bold">{result.message}</p>
            )}
          </div>
        )}
      </div>

      {/* 注意事項區塊 */}
      <div className="w-full max-w-md bg-yellow-50 rounded-xl p-5 border border-yellow-100 text-sm text-gray-700">
        <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
          <span className="mr-2">📌</span> 注意事項
        </h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li>每組禮券序號僅限兌換一次。</li>
          <li>兌換後將產生一組對應的運費券序號。</li>
          <li>請妥善保管您的運費券序號，遺失恕不補發。</li>
          <li>若有任何問題請聯繫客服。</li>
        </ol>
      </div>
    </main>
  );
}