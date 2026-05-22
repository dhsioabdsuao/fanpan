import { Noto_Serif_SC } from 'next/font/google';
import { BirthForm } from '@/components/bazi/BirthForm';

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center bg-stone-50 px-4 py-12">
      <h1
        className="text-5xl text-stone-900"
        style={{ fontFamily: notoSerifSC.style.fontFamily }}
      >
        四柱八字
      </h1>
      <p className="mt-4 mb-10 text-lg text-gray-500">输入生辰，知晓命局</p>
      <div className="w-full max-w-2xl">
        <BirthForm />
      </div>
    </div>
  );
}
