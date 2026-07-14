import { Noto_Serif_SC } from 'next/font/google';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function AboutPage() {
  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-stone-500 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft className="mr-1 size-4" />
          返回首页
        </Link>

        <h1
          className="text-center text-3xl text-stone-600"
          style={{ fontFamily: notoSerifSC.style.fontFamily }}
        >
          关于本站
        </h1>

        {/* Section 1: 网站定位 */}
        <section>
          <h2
            className="mb-4 text-2xl font-semibold text-stone-600"
            style={{ fontFamily: notoSerifSC.style.fontFamily }}
          >
            网站定位
          </h2>
          <p className="leading-relaxed text-base font-medium text-stone-600">
            本站是一个公开免费的八字排盘工具，
            基于传统命理学为用户提供命局解读。
            我们不提供付费咨询、不引导外部联系、不销售任何开运产品。
            本站的目的是让更多人接触到真实的命理传统，
            而不是制造焦虑或贩卖玄学。
          </p>
        </section>

        {/* Section 2: 命理流派说明 */}
        <section>
          <h2
            className="mb-4 text-2xl font-semibold text-stone-600"
            style={{ fontFamily: notoSerifSC.style.fontFamily }}
          >
            命理流派说明
          </h2>
          <p className="leading-relaxed text-base font-medium text-stone-600">
            本站采用子平派命理体系，这是明清以来主流的八字算法，
            由徐子平、沈孝瞻、刘伯温等命理大家奠定基础，流传至今。
          </p>
          <div className="mt-4 leading-relaxed text-base text-stone-600">
            <p className="font-medium text-stone-600">子平派擅长分析：</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>人生大致方向与性格特质</li>
              <li>命局五行偏向与喜用神</li>
              <li>十神组合与人生格局</li>
              <li>各步大运的主要趋势</li>
            </ul>
          </div>
          <div className="mt-4 leading-relaxed text-base text-stone-600">
            <p className="font-medium text-stone-600">子平派的局限：</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>不擅长精确预测具体事件</li>
              <li>流年小事的判断准确率有限</li>
              <li>不同命理师对同一命局可能有不同解读</li>
            </ul>
          </div>
          <p className="mt-4 leading-relaxed text-base text-stone-600">
            如果您希望对具体事件做精细判断，建议咨询专业命理师。
          </p>
        </section>

        {/* Section 3: 我们的方法论 */}
        <section id="methodology">
          <h2
            className="mb-4 text-2xl font-semibold text-stone-600"
            style={{ fontFamily: notoSerifSC.style.fontFamily }}
          >
            我们的方法论
          </h2>
          <p className="leading-relaxed text-base font-medium text-stone-600">
            命理判断是一个综合体系，本站采用以下方法：
          </p>

          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-bold text-stone-600">主干 — 滴天髓</h3>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                以《滴天髓》为分析主干，重点判断：
              </p>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-base text-stone-600">
                <li>日主强弱（月令、地支根、天干透出）</li>
                <li>五行流通（生克泄耗的整体平衡）</li>
                <li>喜用神方向（命局需要什么、忌讳什么）</li>
              </ul>
              <p className="mt-1 text-base text-stone-600">这一层适用于所有命局。</p>
            </div>

            <div>
              <h3 className="font-bold text-stone-600">分级使用 — 子平真诠八格</h3>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                《子平真诠》的八格体系（正官、七杀、正印、偏印、
                食神、伤官、正财、偏财），仅在命局严格成格时启用。
              </p>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                我们的判定标准：月令本气透干、不被冲克合化失用，
                才判定为某格。宁可不成格，不可勉强成格。
              </p>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                实际上，大约 50-70% 的普通命局并不严格成格，
                对这些命局，我们按「不成格普通命局」专属解读，
                以日主强弱与五行流通为主，不强套格局。
              </p>
            </div>

            <div>
              <h3 className="font-bold text-stone-600">调候补充 — 穷通宝鉴</h3>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                对于五行明显偏寒偏热的命局，《穷通宝鉴》的
                调候用神原则会作为补充，平衡命局冷暖燥湿。
              </p>
            </div>

            <div>
              <h3 className="font-bold text-stone-600">真太阳时 — 回归古人观日为时的传统</h3>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                古人以日影定时辰，看的是太阳在天空中的真实位置。
                今天我们使用的北京时间是全国统一的行政时间，以东经120°为标准，
                而中国东西跨度近60个经度——在新疆乌鲁木齐，当北京时间为正午12:00，
                当地太阳仅走到上午9:50左右的位置。经度每差1°，真实太阳时与北京时间
                相差约4分钟，在东西边远地区（新疆、西藏、内蒙古、云南），
                这个偏差可以超过2小时。如果出生时间恰好在时辰交界处，
                偏差足以改变日柱或时柱。古代命师以当地日影为准，不存在这个问题；
                现代排盘使用时区的统一时间，必须做这一步还原。
              </p>
              <p className="mt-2 leading-relaxed text-base text-stone-600">
                真太阳时的换算由两部分组成。第一部分是经度差修正：
                用户出生地的经度与120°E标准经线之间的差异，
                每度对应4分钟。第二部分是均时差修正：
                地球绕太阳公转的轨道是椭圆形的，公转速度并不均匀，
                导致太阳在天空中的真实位置与平均位置之间有一个季节性偏差，
                全年在±16分钟之间波动。两项叠加即为最终的真太阳时偏移量。
                公式与天文学界通用算法一致，精度在1秒以内。
              </p>
              <p className="mt-2 leading-relaxed text-base text-stone-600">
                我们整合了中国大陆34个省级行政区、392个地级市、3209个区县的经纬度数据
                （含港澳台地区），覆盖至区县一级。用户在表单中选择省、市、区后，
                系统自动取该区县的经度进行换算，换算结果在排盘结果页清晰展示。
              </p>
              <p className="mt-2 leading-relaxed text-base text-stone-600">
                如果用户未填写出生地（例如在「只知道时辰」或「不知道时辰」模式下），
                系统会跳过真太阳时换算，直接使用输入的标准时间排盘，
                并在结果页标注「未做真太阳时换算」。
                当用户选择的时辰本身是2小时粒度的十二时辰时，
                几分钟的偏差通常不影响时辰判断；但在精确时辰模式下，
                未做换算的命盘在时间精度上存在一定局限，这一点我们诚实告知。
              </p>
            </div>

            <div>
              <h3
                className="text-xl text-stone-600"
                style={{ fontFamily: notoSerifSC.style.fontFamily }}
              >
                关于具体算法
              </h3>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                命理判断需要将古籍的定性表述转化为可计算的定量规则。
              </p>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                本站算法的定性原则严格遵循古籍——
              </p>
              <ul className="mt-1 list-disc pl-5 space-y-1 text-base text-stone-600">
                <li>月令最重（滴天髓：「令出提纲」）</li>
                <li>通根次之（子平真诠：「通根月令为最，得地次之」）</li>
                <li>近者重远者轻（月支最重，年支最轻）</li>
                <li>克者最伤，泄者最轻（滴天髓：「七杀重于正官」）</li>
                <li>冲合改变力量分布</li>
              </ul>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                但具体的分数和百分比，是基于古籍精神的现代化定量实现。
                古籍只给定性原则，没有给出具体数字。
                不同命理流派和软件在数字上会有微调，这是合理的差异。
              </p>
              <p className="mt-1 leading-relaxed text-base text-stone-600">
                我们公开算法的所有规则供专业人士对照参考，
                也欢迎命理师对算法提出指正。
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: 我们的态度 */}
        <section>
          <h2
            className="mb-4 text-2xl font-semibold text-stone-600"
            style={{ fontFamily: notoSerifSC.style.fontFamily }}
          >
            我们的态度
          </h2>
          <p className="leading-relaxed text-base font-medium text-stone-600">
            命理是中国传统文化的重要组成部分，
            它提供的是一种看待人生的视角，而非命运的判决书。
          </p>
          <p className="mt-2 leading-relaxed text-base text-stone-600">
            八字告诉你来时的禀赋——你的性格倾向、能量分布、
            人生的基础底色。
            但未来的路怎么走，环境如何选择，关系如何经营，
            这些都掌握在你自己手中。
          </p>
          <p className="mt-2 leading-relaxed text-base text-stone-600">
            我们相信：
          </p>
          <p className="mt-1 leading-relaxed text-base text-stone-600">
            知命，是为了更好地认识自己；
          </p>
          <p className="leading-relaxed text-base font-medium text-stone-600">
            不认命，是为了更好地走自己的路。
          </p>
          <p
            className="mt-6 text-xl text-stone-600"
            style={{ fontFamily: notoSerifSC.style.fontFamily }}
          >
            知命而不认命，但行好事，莫问前程。
          </p>
        </section>

        {/* Section 5: 隐私说明 */}
        <section>
          <h2
            className="mb-4 text-2xl font-semibold text-stone-600"
            style={{ fontFamily: notoSerifSC.style.fontFamily }}
          >
            隐私说明
          </h2>
          <p className="leading-relaxed text-base font-medium text-stone-600">
            本站不收集、不存储用户输入的任何生辰信息。
            所有排盘计算在您的浏览器本地完成，
            不发送至任何服务器。
            关闭页面后，所有数据自动消失。
          </p>
        </section>
      </div>
    </div>
  );
}
