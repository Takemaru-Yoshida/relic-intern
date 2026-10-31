import type { Chunk, Doc, Highlight } from "./types";

// デモ用データ。本文は各論文の主旨を要約・言い換えたもの。
type Seed = Omit<Doc, "status" | "starred" | "created_at" | "lang"> & { lang?: "en" | "ja"; body: [string, string][] };

const seeds: Seed[] = [
  {
    id: "d1", title: "Deep Residual Learning for Image Recognition", authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    year: 2016, venue: "CVPR", doi: "10.1109/CVPR.2016.90", pages: 9, tags: ["DNN", "ResNet"], cites: [],
    abstract: "残差学習によって、従来より大幅に深いネットワークの学習を可能にした。",
    body: [
      ["Abstract", "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously."],
      ["Introduction", "We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions."],
      ["Experiments", "On the ImageNet dataset we evaluate residual nets with a depth of up to 152 layers, 8 times deeper than VGG nets but still having lower complexity."],
      ["Experiments", "An ensemble of these residual nets achieves 3.57% top-5 error on the ImageNet test set and won the 1st place on the ILSVRC 2015 classification task."],
    ],
  },
  {
    id: "d2", title: "Representational similarity analysis – connecting the branches of systems neuroscience", authors: ["Nikolaus Kriegeskorte", "Marieke Mur", "Peter Bandettini"],
    year: 2008, venue: "Frontiers in Systems Neuroscience", doi: "10.3389/neuro.06.004.2008", pages: 28, tags: ["RSA", "fMRI", "方法論"], cites: [],
    abstract: "表現非類似度行列（RDM）を介して脳・行動・計算モデルを共通の枠組みで比較する RSA を提案。",
    body: [
      ["Introduction", "RSA characterizes the information carried by a given representation in a brain or model by a representational dissimilarity matrix (RDM)."],
      ["Methods", "Because RDMs abstract from the spatial layout of activity patterns, they can be compared directly between brain regions, individuals, species, and computational models."],
      ["Methods", "We propose comparing RDMs using rank correlation, since the relationship between dissimilarity measures of different modalities need not be linear."],
      ["Discussion", "RSA thus provides a common quantitative framework linking brain-activity measurement, behavioral measurement, and computational modeling."],
    ],
  },
  {
    id: "d3", title: "How biological attention mechanisms improve task performance in a large-scale visual system model", authors: ["Grace W. Lindsay", "Kenneth D. Miller"],
    year: 2018, venue: "eLife", doi: "10.7554/eLife.38105", pages: 29, tags: ["注意", "DNN", "FSG"], cites: ["d5", "d4", "d10"],
    abstract: "CNN に feature-similarity gain 型の注意を実装し、課題性能への効果を層ごとに検証した。",
    body: [
      ["Introduction", "We implement feature-based attention in a convolutional neural network according to the feature similarity gain model."],
      ["Results", "Attention applied at a single layer, especially at later layers, improves performance on challenging object detection tasks."],
      ["Results", "Modulating gain according to tuning curves yields smaller performance benefits than modulating according to gradient values."],
      ["Discussion", "The model makes predictions about how attention-induced changes in neural activity relate to changes in task performance."],
    ],
  },
  {
    id: "d4", title: "Neural mechanisms of selective visual attention", authors: ["Robert Desimone", "John Duncan"],
    year: 1995, venue: "Annual Review of Neuroscience", doi: "10.1146/annurev.ne.18.030195.001205", pages: 30, tags: ["注意", "Biased competition"], cites: [],
    abstract: "視野内の物体は限られた処理資源を奪い合い、その競合がトップダウン信号によってバイアスされる（biased competition）。",
    body: [
      ["Introduction", "Objects in the visual field compete for representation, analysis, and control because processing capacity is limited."],
      ["Model", "This competition is biased by bottom-up factors and by top-down signals that reflect the observer's goals."],
      ["Discussion", "Attention is therefore viewed as an emergent property of competitive interactions among neurons rather than a separate spotlight mechanism."],
    ],
  },
  {
    id: "d5", title: "Feature-based attention influences motion processing gain in macaque visual cortex", authors: ["Stefan Treue", "Julio C. Martinez-Trujillo"],
    year: 1999, venue: "Nature", doi: "10.1038/21176", pages: 4, tags: ["注意", "FSG", "電気生理"], cites: [],
    abstract: "MT ニューロンの応答ゲインが、注意された特徴と選好特徴の類似度に応じて変調される（feature-similarity gain）。",
    body: [
      ["Results", "Attending to a feature modulates responses of MT neurons according to the similarity between the attended feature and the neuron's preferred feature."],
      ["Results", "This feature-similarity gain changes response gain without sharpening the tuning curves."],
      ["Discussion", "The modulation is observed even for stimuli outside the attended location, indicating a spatially global effect."],
    ],
  },
  {
    id: "d6", title: "Circular analysis in systems neuroscience: the dangers of double dipping", authors: ["Nikolaus Kriegeskorte", "W. Kyle Simmons", "Patrick S. F. Bellgowan", "Chris I. Baker"],
    year: 2009, venue: "Nature Neuroscience", doi: "10.1038/nn.2303", pages: 7, tags: ["方法論", "統計"], cites: ["d2"],
    abstract: "選択と解析に同じデータを使う循環解析の危険性と、その回避基準を示した。",
    body: [
      ["Introduction", "Circular analysis uses the same data for selection and selective analysis, which can distort the results."],
      ["Recommendations", "We recommend that selection criteria be independent of the test statistic under the null hypothesis."],
    ],
  },
  {
    id: "d7", title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", authors: ["Patrick Lewis", "Ethan Perez", "Aleksandra Piktus"],
    year: 2020, venue: "NeurIPS", doi: "10.48550/arXiv.2005.11401", pages: 16, tags: ["RAG", "NLP"], cites: [],
    abstract: "パラメトリック記憶と密ベクトル検索による非パラメトリック記憶を組み合わせた生成モデル（RAG）。",
    body: [
      ["Introduction", "We combine pre-trained parametric memory with a non-parametric memory: a dense vector index of Wikipedia accessed with a neural retriever."],
      ["Results", "RAG models generate more specific, diverse and factual language than a parametric-only baseline."],
    ],
  },
  {
    id: "d8", title: "物体ベース注意と腹側視覚野の表象：予備解析ノート", authors: ["研究室メモ"], lang: "ja",
    year: 2026, venue: "Lab note", pages: 6, tags: ["注意", "fMRI", "RSA"], cites: ["d2", "d4", "d1", "d6"],
    abstract: "2 物体を重畳した画像で一方に注意を向けたときの HVC の表象を RSA で解析した予備結果。",
    body: [
      ["目的", "2 つの物体を重ね合わせた画像のうち、手がかりで指定された一方に注意を向けたときの腹側視覚野の表象を調べる。"],
      ["方法", "高次視覚野（HVC）の活動パターンから表現非類似度行列を作成し、注意ゲート付き ResNet-50 の各層と順位相関で比較した。"],
      ["結果", "注意を向けた物体を共有する条件対は、非注意物体を共有する条件対よりも表象が近く、注意された物体が表象を支配していた。"],
      ["考察", "この性質はゲートが正しいカテゴリを向いたネットワークでのみ再現され、biased competition の枠組みと整合する。"],
    ],
  },
  {
    id: "d9", title: "The normalization model of attention", authors: ["John H. Reynolds", "David J. Heeger"],
    year: 2009, venue: "Neuron", doi: "10.1016/j.neuron.2009.01.002", pages: 13, tags: ["注意", "正規化"], cites: ["d4", "d5"],
    abstract: "注意を正規化計算として定式化し、応答ゲインとコントラストゲインの変化を統一的に説明した。",
    body: [
      ["Model", "Attention modulates neural responses through a normalization computation in which the stimulus drive is multiplied by an attention field and divided by the suppressive drive."],
      ["Results", "Depending on stimulus size and attention field size, the model can produce either response gain or contrast gain changes."],
    ],
  },
  {
    id: "d10", title: "Performance-optimized hierarchical models predict neural responses in higher visual cortex", authors: ["Daniel L. K. Yamins", "Ha Hong", "Charles F. Cadieu", "James J. DiCarlo"],
    year: 2014, venue: "PNAS", doi: "10.1073/pnas.1403112111", pages: 6, tags: ["DNN", "脳との比較"], cites: ["d2"],
    abstract: "物体認識性能を最適化した階層モデルほど IT 野の神経応答をよく予測する。",
    body: [
      ["Results", "Models optimized for object categorization performance best predicted IT neural responses."],
      ["Results", "The top layer of the model predicts IT multiunit responses, while intermediate layers predict V4 responses."],
    ],
  },
];

export const docs: Doc[] = seeds.map(({ body, lang, ...s }, i) => ({
  ...s, lang: lang ?? "en", status: "indexed", starred: i % 3 === 1,
  created_at: new Date(Date.UTC(2026, 9, 28 - i)).toISOString(),
}));

export const chunks: Chunk[] = seeds.flatMap((s) =>
  s.body.map(([section, content], j) => ({ id: `${s.id}-c${j}`, document_id: s.id, page: j + 1, section, content })),
);

// AI が抽出した重要文
export const highlights: Highlight[] = [
  ["d1-c1", "手法の中核（残差関数の定式化）"], ["d1-c3", "主要な定量結果"],
  ["d2-c1", "RDM が異なるモダリティを比較可能にする理由"], ["d2-c2", "比較指標の選択根拠"],
  ["d3-c0", "注意実装の方式"], ["d3-c1", "主結果"],
  ["d4-c1", "biased competition の定義"], ["d5-c1", "FSG の性質（チューニングは鋭くならない）"],
  ["d6-c1", "循環解析を避ける基準"], ["d7-c0", "RAG の構成"],
  ["d8-c2", "主結果"], ["d9-c0", "モデルの定式化"], ["d10-c0", "主結果"],
].map(([chunk_id, reason], i) => ({ id: `h${i}`, document_id: chunk_id.split("-")[0], chunk_id, kind: "ai_key", reason }));

// ファクトチェックのサンプル原稿（AI 生成を想定。誤引用を含む）
export const sampleManuscript = [
  "Residual learning enabled training networks with up to 152 layers on ImageNet (He et al., 2016).",
  "RDMs can be compared across brains and models because they abstract from the spatial layout of activity patterns (Kriegeskorte et al., 2008).",
  "Lindsay and Miller showed that feature-based attention in CNNs reproduces the fMRI representational geometry of human visual cortex (Lindsay & Miller, 2018).",
  "Feature-based attention sharpens the tuning curves of MT neurons (Treue & Martinez-Trujillo, 1999).",
  "Object-based attention in ventral cortex is fully explained by spatial attention (Tanaka et al., 2021).",
].join(" ");

// サンプル文に対する判定（モック）。キーは引用の第一著者
export const presetVerdicts: Record<string, { verdict: "supported" | "partial" | "refuted"; chunk: string; note: string }> = {
  He: { verdict: "supported", chunk: "d1-c2", note: "152 層の残差ネットを ImageNet で評価した記述と一致します。" },
  Kriegeskorte: { verdict: "supported", chunk: "d2-c1", note: "RDM が活動パターンの空間配置から抽象化されるため比較可能、という記述と一致します。" },
  Lindsay: { verdict: "partial", chunk: "d3-c0", note: "CNN への FSG 型注意の実装は記載がありますが、fMRI の表現幾何との比較は本文中に見つかりません。" },
  Treue: { verdict: "refuted", chunk: "d5-c1", note: "原文は「チューニング曲線を鋭くせずにゲインを変える」と述べており、主張と矛盾します。" },
};
