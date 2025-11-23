import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Copy, Check, Utensils, Receipt, Sparkles, User, RefreshCcw } from 'lucide-react';

export default function App() {
  // --- 狀態管理 ---
  const [items, setItems] = useState([
    { id: 1, name: '', price: '' },
    { id: 2, name: '', price: '' }
  ]);
  const [extraFee, setExtraFee] = useState(''); // 運費/雜支
  const [discount, setDiscount] = useState(''); // 折扣
  const [copied, setCopied] = useState(false);
  const listEndRef = useRef(null);

  // --- 功能邏輯 ---

  // 增加一人 (自動捲動到底部)
  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', price: '' }]);
    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 刪除項目
  const deleteItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  // 更新資料
  const updateItem = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(newItems);
  };

  // 重置
  const handleReset = () => {
    if (window.confirm('確定要清空所有資料重新計算嗎？')) {
      setItems([{ id: Date.now(), name: '', price: '' }, { id: Date.now() + 1, name: '', price: '' }]);
      setExtraFee('');
      setDiscount('');
    }
  };

  // --- 核心計算邏輯 (保持不變) ---
  const { subtotal, finalTotal, calculations } = useMemo(() => {
    const sub = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
    const extra = parseFloat(extraFee) || 0;
    const disc = parseFloat(discount) || 0;
    const total = Math.max(0, sub + extra - disc);

    const results = items.map(item => {
      const price = parseFloat(item.price) || 0;
      if (sub === 0) return { ...item, finalPay: 0 };
      
      // 權重計算
      const ratio = price / sub;
      const fairShare = ratio * total;
      
      return {
        ...item,
        rawPrice: price,
        finalPay: Math.round(fairShare)
      };
    });

    // 修正尾差 (補給大戶)
    if (sub > 0) {
      const currentSum = results.reduce((acc, item) => acc + item.finalPay, 0);
      const diff = Math.round(total) - currentSum;
      if (diff !== 0) {
        const maxPriceIndex = results.reduce((maxIdx, item, idx, arr) => 
          item.rawPrice > arr[maxIdx].rawPrice ? idx : maxIdx, 0
        );
        results[maxPriceIndex].finalPay += diff;
      }
    }

    return {
      subtotal: sub,
      finalTotal: Math.round(total),
      calculations: results
    };
  }, [items, extraFee, discount]);

  // --- 複製功能 ---
  const handleCopy = () => {
    const date = new Date().toLocaleDateString();
    let text = `🧾 分帳結果 (${date})\n`;
    text += `──────────────\n`;
    calculations.forEach(item => {
      if (item.name || item.rawPrice > 0) {
        const name = item.name || '朋友';
        text += `${name}: $${item.finalPay} (原$${item.rawPrice})\n`;
      }
    });
    text += `──────────────\n`;
    text += `💰 總金額: $${finalTotal}\n`;
    if (extraFee) text += `(含運費 +${extraFee})\n`;
    if (discount) text += `(含折扣 -${discount})\n`;
    
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-32">
      
      {/* 頂部導航列 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <Receipt className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">分帳神器 2.0</h1>
        </div>
        <button onClick={handleReset} className="text-slate-400 hover:text-slate-600 transition-colors">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* 全局設定卡片 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={14} /> 訂單設定
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">外送費/小費</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">+</span>
                <input
                  type="number"
                  value={extraFee}
                  onChange={(e) => setExtraFee(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-emerald-50/50 border-0 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">折扣金額</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold">-</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-rose-50/50 border-0 rounded-xl text-slate-700 focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 人員清單 */}
        <div className="space-y-3">
          <div className="flex justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Utensils size={14} /> 點餐明細 ({items.length}人)
            </h2>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="group bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 animate-slideIn">
              
              {/* 名字輸入 */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  placeholder={`朋友 ${index + 1}`}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-700 text-sm transition-all"
                />
              </div>

              {/* 金額輸入 */}
              <div className="w-28 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                  placeholder="0"
                  className="w-full pl-6 pr-3 py-2 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 font-semibold text-right transition-all"
                />
              </div>

              {/* 刪除按鈕 */}
              <button
                onClick={() => deleteItem(item.id)}
                className={`p-2 rounded-xl transition-colors ${items.length === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:bg-rose-50 hover:text-rose-500'}`}
                disabled={items.length === 1}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          
          {/* 隱藏錨點，用於自動捲動 */}
          <div ref={listEndRef} />

          <button
            onClick={addItem}
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={18} />
            新增一位朋友
          </button>
        </div>
      </div>

      {/* 底部懸浮結帳列 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pb-6 md:pb-4 safe-area-bottom z-20">
        <div className="max-w-md mx-auto">
          {/* 總覽資訊 */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">總金額 (Total)</p>
              <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
                <span className="text-sm text-slate-400 font-normal">$</span>
                {finalTotal}
              </div>
            </div>
            
            {/* 顯示當前計算狀態的提示 */}
            <div className="text-right">
               <p className="text-xs text-slate-400 mb-0.5">原價小計</p>
               <p className="text-slate-600 font-medium">${Math.round(subtotal)}</p>
            </div>
          </div>

          {/* 操作按鈕 */}
          <button
            onClick={handleCopy}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
              copied ? 'bg-slate-800' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {copied ? (
              <>
                <Check size={20} /> 已複製到剪貼簿
              </>
            ) : (
              <>
                <Copy size={20} /> 複製分帳結果
              </>
            )}
          </button>
        </div>
      </div>

      {/* 全局樣式 */}
      <style>{`
        /* 隱藏數字輸入框的上下箭頭 */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        /* 動畫效果 */
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        /* iOS 底部安全區域 */
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
}