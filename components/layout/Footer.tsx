import { Noto_Serif_SC } from 'next/font/google';
import Link from 'next/link';

const notoSerifSC = Noto_Serif_SC({
  weight: ['400'],
  subsets: ['latin'],
});

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 text-sm text-stone-600">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-2 font-semibold text-stone-500">关于本站</h3>
            <p>
              <Link href="/about" className="hover:text-stone-600 transition-colors">
                了解更多
              </Link>
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-stone-500">方法论</h3>
            <p>
              <Link href="/about#methodology" className="hover:text-stone-600 transition-colors">
                子平派命理体系
              </Link>
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-stone-500">免责声明</h3>
            <p>本站内容仅供文化研究与娱乐参考</p>
          </div>
        </div>
        <div className="mt-8 border-t border-stone-200 pt-6 text-center">
          <p>
            &copy; {year} 四柱八字 &middot;{' '}
            <span style={{ fontFamily: notoSerifSC.style.fontFamily }}>
              知命而不认命
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
