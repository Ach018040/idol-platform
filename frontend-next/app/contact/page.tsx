import type{Metadata}from 'next';
export const metadata:Metadata={title:'聯絡我們',description:'如需資料更正、合作洽詢或內容聯繫，可透過本站聯絡頁。'};
export default function ContactPage(){return(<div className="mx-auto max-w-4xl px-6 py-16"><h1 className="text-4xl font-bold text-white">聯絡我們</h1><div className="mt-8 space-y-6 text-base leading-8 text-zinc-300"><p>若您有資料更正、合作洽詢、版權疑問或其他聯繫需求，請來信：<a className="ml-2 text-cyan-300 underline" href="mailto:cheng0180400215@gmail.com">cheng0180400215@gmail.com</a></p><p>我們會依照內容性質，於合理時間內進行回覆與處理。</p></div></div>)}
