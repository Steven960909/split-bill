import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, Copy, Check, DollarSign, Utensils, RefreshCw } from 'lucide-react';

export default function App() {
  // 狀態管理
  const [items, setItems] = useState([
    { id: 1, name: '', price: '' },
    { id: 2, name: '', price: '' }
  ]);
  const [extraFee, setExtraFee] = useState(''); // 外送費/小費
  const [discount, setDiscount] = useState(''); // 折扣
  const [copied, setCopied] = useState(false);

  // 增加一位朋友/餐點
  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', price: '' }]);
  };

  // 刪除某一行
  const deleteItem = (id) => {
    if (items.length === 1) return; // 至少保留一行
    setItems(items.filter(item => item.id !== id));
  };

  // 更新輸入內容
  const updateItem = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(newItems);
  };

  // 清除所有資料
  const handleReset = () => {
    if (window.confirm('確定要清空所有資料嗎？')) {
      setItems([{ id: Date.now(), name: '', price: '' }, { id: Date.now() + 1, name: '', price: '' }]);
      setExtraFee('');
      setDiscount('');
    }
  };

  // 計算邏輯
  const { 
    subtotal, // 餐點原價總和
    finalTotal, // 實際應付總金額
    calculations // 每個人的應付金額與明細
  } = useMemo(() => {
    // 1. 計算餐點總原價
    const sub = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
    
    // 2. 取得額外費用與折扣
    const extra = parseFloat(extraFee) || 0;
    const disc = parseFloat(discount) || 0;
    
    // 3. 計算實際應付總金額 (餐點總和 + 運費 - 折扣)
    // 防止負數
    const total = Math.max(0, sub + extra - disc);

    // 4. 計算每個人的分攤比例與金額
    const results = items.map(item => {
      const price = parseFloat(item.price) || 0;
      if (sub === 0) return { ...item, finalPay: 0 };

      // 核心算法：(個人餐點價 / 餐點總原價) * 實際應付總金額
      // 這樣可以確保運費和折扣是「按比例」分攤的
      const ratio = price / sub;
      const fairShare = ratio * total;
      
      return {
        ...item,
        rawPrice: price,
        finalPay: Math.round(fairShare) // 四捨五入到整數
      };
    });

    // 修正四捨五入造成的誤差
    // 因為每個項目都四捨五入，加總起來可能會跟 total 差 1-2 元
    // 這裡我們把誤差加在價格最高的那個人身上 (通常是大戶)
    if (sub > 0) {
      const currentSum = results.reduce((acc, item) => acc + item.finalPay, 0);
      const diff = Math.round(total) - currentSum;
      
      if (diff !== 0) {
        // 找到價格最高的人的索引
        const maxPriceIndex = results.reduce((maxIdx, item, idx, arr) => 
          item.rawPrice > arr[maxIdx].rawPrice ? idx : maxIdx, 0
        );
        results[maxPriceIndex].finalPay += diff;
      }
    }

    return {
      subtotal: sub,
      finalTotal: Math.max(0, sub + extra - disc),
      calculations: results
    };
  }, [items, extraFee, discount]);

  // 複製結果到剪貼簿
  const handleCopy = () => {
    const date = new Date().toLocaleDateString();
    let text = `📅 訂單分帳 (${date})\n`;
    text += `----------------\n`;
    calculations.forEach(item => {
      if (item.name || item.price) {
        const name = item.name || '朋友';
        text += `${name}: $${item.finalPay}\n`;
      }
    });
    text += `----------------\n`;
    text += `💰 餐點原價: $${subtotal}\n`;
    if (extraFee) text += `🛵 運費/雜支: +$${extraFee}\n`;
    if (discount) text += `🎟️ 折扣: -$${discount}\n`;
    text += `💵 實付總額: $${Math.round(finalTotal)}\n`;
    
    // 使用較舊但兼容性更好的 execCommand
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 md:p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Utensils className="w-6 h-6" />
              外送分帳神器
            </h1>
            <p className="text-emerald-100 text-sm mt-1">自動按比例分攤運費與折扣</p>
          </div>
          <button 
            onClick={handleReset}
            className="text-emerald-200 hover:text-white transition-colors p-2 rounded-full hover:bg-emerald-700"
            title="重置"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Global Settings */}
        <div className="p-6 bg-emerald-50 space-y-4 border-b border-emerald-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 uppercase tracking-wide">外送費 / 雜支</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">+</span>
                </div>
                <input
                  type="number"
                  value={extraFee}
                  onChange={(e) => setExtraFee(e.target.value)}
                  placeholder="0"
                  className="pl-8 block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 uppercase tracking-wide">折扣 / 優惠券</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-red-400 font-bold">-</span>
                </div>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="pl-8 block w-full rounded-lg border-gray-300 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-700">點餐清單</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {items.length} 人
            </span>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 animate-fadeIn">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  placeholder={`朋友 ${index + 1}`}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-gray-50"
                />
              </div>
              <div className="w-28 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={14} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                  placeholder="金額"
                  className="pl-7 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 bg-gray-50 font-medium text-gray-700"
                />
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                disabled={items.length === 1}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full mt-4 py-3 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 font-medium hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            增加一人
          </button>
        </div>

        {/* Results */}
        <div className="bg-gray-900 text-white p-6 pb-8 rounded-t-3xl -mx-1 shadow-inner relative mt-4">
          <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-4">
            <div>
              <p className="text-gray-400 text-sm">餐點總計 (未折抵)</p>
              <p className="text-xl font-medium text-gray-300">${Math.round(subtotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider">每人應付總額</p>
              <p className="text-4xl font-bold text-white">${Math.round(finalTotal)}</p>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {calculations.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-200 font-medium">
                      {item.name || '未命名'}
                    </span>
                    {item.rawPrice > 0 && (
                      <span className="text-gray-500 text-xs">
                        原價 ${item.rawPrice}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold text-emerald-400">
                  ${item.finalPay}
                </span>
              </div>
            ))}
            
            {calculations.length === 0 || subtotal === 0 && (
              <div className="text-center text-gray-600 py-4 text-sm">
                請輸入餐點金額開始計算
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className={`absolute -top-6 right-6 shadow-lg transform transition-all duration-200 ${
              copied ? 'bg-green-500 scale-105' : 'bg-white hover:bg-gray-100'
            } text-gray-900 rounded-full px-6 py-3 font-bold flex items-center gap-2 border-4 border-gray-50`}
          >
            {copied ? <Check size={20} className="text-white" /> : <Copy size={20} className="text-emerald-600" />}
            <span className={copied ? 'text-white' : 'text-emerald-800'}>
              {copied ? '已複製！' : '複製結果'}
            </span>
          </button>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 2px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}