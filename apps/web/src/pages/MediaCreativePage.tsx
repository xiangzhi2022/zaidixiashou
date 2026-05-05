import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Image, Video, Sparkles, Save, Send, FileImage } from 'lucide-react';
import { useState } from 'react';

export function MediaCreativePage() {
  const [apiSource, setApiSource] = useState<'platform' | 'ownkey'>('platform');
  const [imageTopic, setImageTopic] = useState('旅行收纳主题');
  const [videoTopic, setVideoTopic] = useState('旅行收纳神器推荐');
  const [imageDirection, setImageDirection] = useState('旅行收纳好物分享，实用技巧为主，清新风格');
  const [videoScript, setVideoScript] = useState('30秒短视频，节奏紧凑，开头有钩子，结尾引导互动');

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">图像视频生成</h1>
          <p className="text-sm text-on-surface-variant mt-1">AI 驱动的图文配图与视频脚本创作工具</p>
        </div>
        <Link to="/media" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />返回运营中心
        </Link>
      </div>

      {/* API Source Bar */}
      <div className="bg-surface rounded-lg shadow-card p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-on-surface">AI来源</span>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="api-source" checked={apiSource === 'platform'} onChange={() => setApiSource('platform')} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-on-surface">平台API</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-primary/10 text-primary">今日剩余 320/500</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="api-source" checked={apiSource === 'ownkey'} onChange={() => setApiSource('ownkey')} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-on-surface">自带Key</span>
          </label>
        </div>
      </div>

      {/* Generator Forms */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left: Image Generator */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-on-surface">图文与配图生成</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">选题</label>
              <input type="text" value={imageTopic} onChange={(e) => setImageTopic(e.target.value)} className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">目标平台</label>
              <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none">
                <option>小红书</option><option>抖音</option><option>TikTok</option><option>Instagram</option><option>微博</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">生成方向</label>
              <textarea rows={3} value={imageDirection} onChange={(e) => setImageDirection(e.target.value)} className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none" placeholder="描述你希望生成的内容方向、风格、重点..." />
            </div>
            <button className="w-full bg-primary text-on-primary px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />生成图文配图
            </button>
          </div>
        </div>

        {/* Right: Video Script Generator */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-on-surface">视频脚本与分镜</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">选题</label>
              <input type="text" value={videoTopic} onChange={(e) => setVideoTopic(e.target.value)} className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">目标平台</label>
              <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none">
                <option>抖音</option><option>TikTok</option><option>小红书</option><option>Instagram</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">脚本要求</label>
              <textarea rows={3} value={videoScript} onChange={(e) => setVideoScript(e.target.value)} className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none" placeholder="描述视频脚本风格、时长、节奏要求..." />
            </div>
            <button className="w-full bg-primary text-on-primary px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />生成脚本分镜
            </button>
          </div>
        </div>
      </div>

      {/* Generated Results */}
      <div className="grid grid-cols-2 gap-6">
        {/* Image Result */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-on-surface">图文生成结果</h2>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-success/15 text-success">已生成</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-on-surface-variant mb-1">小红书标题</p>
              <p className="text-sm font-semibold text-on-surface leading-relaxed">🎒旅行收纳指南｜5个神仙技巧让行李箱多装一倍！</p>
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant mb-1.5">配图建议</p>
              <div className="space-y-2">
                {[
                  { title: '封面图：收纳前后对比', desc: '俯拍行李箱整齐排列，暖光' },
                  { title: '内页图：收纳袋使用演示', desc: '分类装入衣物，步骤式展示' },
                  { title: '内页图：好物平铺清单', desc: '白色背景平铺摆拍，标注品牌' },
                ].map((img) => (
                  <div key={img.title} className="flex items-center gap-3 bg-surface-container rounded-md p-2.5">
                    <div className="w-12 h-12 rounded bg-surface-container-high shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{img.title}</p>
                      <p className="text-xs text-on-surface-variant">{img.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant mb-1.5">话题标签</p>
              <div className="flex flex-wrap gap-1.5">
                {['#旅行收纳', '#行李箱整理', '#出行好物', '#收纳神器', '#旅行必备'].map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />保存草稿
              </button>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />提交审核
              </button>
            </div>
          </div>
        </div>

        {/* Video Script Result */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-on-surface">脚本分镜结果</h2>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-success/15 text-success">已生成</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-on-surface-variant mb-1">视频标题</p>
              <p className="text-sm font-semibold text-on-surface leading-relaxed">旅行收纳神器推荐｜30秒教你行李箱多塞一倍！</p>
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant mb-1.5">分镜脚本</p>
              <div className="space-y-2">
                {[
                  { time: '0-3s', desc: '开头钩子：行李箱爆炸画面 → "每次打包都崩溃？"' },
                  { time: '3-15s', desc: '核心展示：3个神器使用对比演示' },
                  { time: '15-25s', desc: '效果展示：收纳前后对比，整齐行李箱' },
                  { time: '25-30s', desc: '结尾引导：点赞+收藏，评论区分享你的收纳技巧' },
                ].map((scene) => (
                  <div key={scene.time} className="flex items-start gap-3 bg-surface-container rounded-md p-2.5">
                    <span className="shrink-0 text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{scene.time}</span>
                    <p className="text-sm text-on-surface">{scene.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />保存草稿
              </button>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />提交审核
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
