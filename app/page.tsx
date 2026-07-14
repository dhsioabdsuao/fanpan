import { Noto_Serif_SC } from 'next/font/google';
import { Suspense } from 'react';
import { BirthForm } from '@/components/bazi/BirthForm';

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center px-4 py-12">
      <h1
        className="text-5xl font-bold text-[#aa9c82] drop-shadow-[0_0_20px_rgba(0,0,0,0.4)]"
        style={{ fontFamily: notoSerifSC.style.fontFamily }}
      >
        四柱八字
      </h1>
      <p className="mt-4 mb-10 text-lg font-semibold text-[#aa9c82]/80 drop-shadow-[0_0_12px_rgba(0,0,0,0.3)]">输入生辰，知晓命局</p>
      <div className="my-6 max-w-xl text-center text-sm leading-relaxed font-medium text-[#aa9c82]/70 drop-shadow-[0_0_8px_rgba(0,0,0,0.25)]">
        <p>本站采用传统子平派命理排盘与解读</p>
        <p>可见人生大致方向、性格特质、五行格局</p>
        <p>具体事件流变数较多，不可执着精准</p>
      </div>
      <div className="w-full max-w-2xl">
        <Suspense fallback={null}>
          <BirthForm />
        </Suspense>
      </div>
    </div>
  );
}
