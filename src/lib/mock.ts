import type { Chunk, Doc, Highlight } from "./types";

// デモ用データ。本文は各論文の主旨を要約・言い換えたもの。
type Seed = Omit<Doc, "status" | "starred" | "created_at" | "lang"> & { lang?: "en" | "ja"; body: [string, string][] };

const seeds: Seed[] = [
  {
    id: "d1", title: "ImageNet Classification with Deep Convolutional Neural Networks", authors: ["Alex Krizhevsky", "Ilya Sutskever", "Geoffrey E. Hinton"],
    year: 2012, venue: "NeurIPS", pages: 9, tags: ["CNN", "画像認識"], cites: [],
    abstract: "大規模な CNN を GPU で学習し、ImageNet の画像分類で従来法を大きく上回った（AlexNet）。",
    body: [
      ["Abstract", "We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into 1000 different classes."],
      ["Architecture", "The network has 60 million parameters and 650,000 neurons, and consists of five convolutional layers followed by three fully-connected layers."],
      ["Architecture", "Training with non-saturating ReLU nonlinearities is several times faster than with saturating units, and we used an efficient GPU implementation of the convolution operation."],
      ["Results", "A variant of this model achieved a winning top-5 test error rate of 15.3% in ILSVRC-2012, compared to 26.2% achieved by the second-best entry."],
    ],
  },
  {
    id: "d2", title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting", authors: ["Nitish Srivastava", "Geoffrey Hinton", "Alex Krizhevsky", "Ilya Sutskever", "Ruslan Salakhutdinov"],
    year: 2014, venue: "JMLR", pages: 30, tags: ["正則化"], cites: ["d1"],
    abstract: "学習中にユニットをランダムに落とすことで共適応を防ぎ、過学習を抑える Dropout を提案。",
    body: [
      ["Abstract", "The key idea is to randomly drop units, along with their connections, from the neural network during training. This prevents units from co-adapting too much."],
      ["Method", "At test time, it is easy to approximate the effect of averaging the predictions of exponentially many thinned networks by simply using a single unthinned network that has smaller weights."],
      ["Results", "Dropout significantly reduces overfitting and gives major improvements over other regularization methods on vision, speech recognition and document classification tasks."],
    ],
  },
  {
    id: "d3", title: "Adam: A Method for Stochastic Optimization", authors: ["Diederik P. Kingma", "Jimmy Ba"],
    year: 2015, venue: "ICLR", doi: "10.48550/arXiv.1412.6980", pages: 15, tags: ["最適化"], cites: [],
    abstract: "勾配の 1 次・2 次モーメントの推定に基づく適応的な確率的最適化手法 Adam を提案。",
    body: [
      ["Abstract", "We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments."],
      ["Algorithm", "The method is straightforward to implement, is computationally efficient, has little memory requirements, and is invariant to diagonal rescaling of the gradients."],
      ["Algorithm", "Because the moment estimates are initialized at zero, they are biased towards zero during the initial timesteps, and we apply bias-correction terms to counteract this."],
    ],
  },
  {
    id: "d4", title: "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift", authors: ["Sergey Ioffe", "Christian Szegedy"],
    year: 2015, venue: "ICML", doi: "10.48550/arXiv.1502.03167", pages: 11, tags: ["正規化", "最適化"], cites: ["d2"],
    abstract: "ミニバッチごとに層の入力を正規化し、深いネットワークの学習を高速化・安定化する。",
    body: [
      ["Abstract", "Training is complicated by the fact that the distribution of each layer's inputs changes during training, as the parameters of the previous layers change. We refer to this phenomenon as internal covariate shift."],
      ["Method", "Our method draws its strength from making normalization a part of the model architecture and performing the normalization for each training mini-batch."],
      ["Results", "Batch Normalization allows us to use much higher learning rates and be less careful about initialization. It also acts as a regularizer, in some cases eliminating the need for Dropout."],
      ["Results", "Applied to a state-of-the-art image classification model, Batch Normalization achieves the same accuracy with 14 times fewer training steps."],
    ],
  },
  {
    id: "d5", title: "Deep Residual Learning for Image Recognition", authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    year: 2016, venue: "CVPR", doi: "10.1109/CVPR.2016.90", pages: 9, tags: ["CNN", "画像認識"], cites: ["d1", "d2", "d4"],
    abstract: "残差学習によって、従来より大幅に深いネットワークの学習を可能にした（ResNet）。",
    body: [
      ["Abstract", "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously."],
      ["Introduction", "We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions."],
      ["Experiments", "On the ImageNet dataset we evaluate residual nets with a depth of up to 152 layers, 8 times deeper than VGG nets but still having lower complexity."],
      ["Experiments", "An ensemble of these residual nets achieves 3.57% top-5 error on the ImageNet test set and won the 1st place on the ILSVRC 2015 classification task."],
    ],
  },
  {
    id: "d6", title: "Generative Adversarial Nets", authors: ["Ian J. Goodfellow", "Jean Pouget-Abadie", "Mehdi Mirza", "Bing Xu", "David Warde-Farley", "Sherjil Ozair", "Aaron Courville", "Yoshua Bengio"],
    year: 2014, venue: "NeurIPS", doi: "10.48550/arXiv.1406.2661", pages: 9, tags: ["生成モデル"], cites: [],
    abstract: "生成器と識別器を競わせて学習する敵対的生成ネットワーク（GAN）を提案。",
    body: [
      ["Abstract", "We simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G."],
      ["Theory", "This framework corresponds to a minimax two-player game. In the space of arbitrary functions, a unique solution exists, with G recovering the training data distribution and D equal to 1/2 everywhere."],
      ["Discussion", "There is no need for any Markov chains or unrolled approximate inference networks during either training or generation of samples."],
    ],
  },
  {
    id: "d7", title: "Deep learning", authors: ["Yann LeCun", "Yoshua Bengio", "Geoffrey Hinton"],
    year: 2015, venue: "Nature", doi: "10.1038/nature14539", pages: 9, tags: ["総説"], cites: ["d1", "d2"],
    abstract: "表現学習としての深層学習の原理と、画像・音声・言語での成果を概観した総説。",
    body: [
      ["Abstract", "Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction."],
      ["Introduction", "Deep learning discovers intricate structure in large data sets by using the backpropagation algorithm to indicate how a machine should change its internal parameters."],
      ["Outlook", "Deep convolutional nets have brought about breakthroughs in processing images, video, speech and audio, whereas recurrent nets have shone light on sequential data such as text and speech."],
    ],
  },
  {
    id: "d8", title: "Attention Is All You Need", authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"],
    year: 2017, venue: "NeurIPS", doi: "10.48550/arXiv.1706.03762", pages: 15, tags: ["Transformer", "NLP"], cites: ["d3", "d5", "d2"],
    abstract: "再帰も畳み込みも使わず、注意機構のみで構成した Transformer を提案。",
    body: [
      ["Abstract", "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."],
      ["Model", "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions."],
      ["Results", "The model is more parallelizable and requires significantly less time to train, achieving 28.4 BLEU on the WMT 2014 English-to-German translation task."],
    ],
  },
  {
    id: "d9", title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
    year: 2019, venue: "NAACL", doi: "10.18653/v1/N19-1423", pages: 16, tags: ["Transformer", "NLP", "事前学習"], cites: ["d8", "d3"],
    abstract: "マスク言語モデルで双方向の文脈表現を事前学習し、少ない追加で多様なタスクに転用する BERT を提案。",
    body: [
      ["Abstract", "BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers."],
      ["Method", "We use a masked language model pre-training objective, which randomly masks some of the tokens from the input and predicts the original vocabulary id of the masked word."],
      ["Results", "The pre-trained BERT model can be fine-tuned with just one additional output layer and obtains new state-of-the-art results on eleven natural language processing tasks."],
    ],
  },
  {
    id: "d10", title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", authors: ["Alexey Dosovitskiy", "Lucas Beyer", "Alexander Kolesnikov", "Dirk Weissenborn", "Xiaohua Zhai", "Neil Houlsby"],
    year: 2021, venue: "ICLR", doi: "10.48550/arXiv.2010.11929", pages: 22, tags: ["Transformer", "画像認識", "事前学習"], cites: ["d8", "d9", "d5", "d3"],
    abstract: "画像をパッチの列として扱い、純粋な Transformer で画像分類を行う Vision Transformer（ViT）を提案。",
    body: [
      ["Abstract", "We show that a pure transformer applied directly to sequences of image patches can perform very well on image classification tasks."],
      ["Method", "We split an image into fixed-size patches, linearly embed each of them, add position embeddings, and feed the resulting sequence of vectors to a standard Transformer encoder."],
      ["Results", "When trained on mid-sized datasets without strong regularization, these models yield accuracies a few percentage points below ResNets of comparable size, because Transformers lack some of the inductive biases inherent to CNNs."],
      ["Results", "When pre-trained on large amounts of data and transferred to multiple image recognition benchmarks, Vision Transformer attains excellent results compared to state-of-the-art convolutional networks."],
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
  ["d1-c1", "モデルの規模と構成"], ["d1-c3", "主要な定量結果"],
  ["d2-c0", "Dropout の中心的なアイデア"], ["d2-c1", "テスト時の近似"],
  ["d3-c0", "手法の定義"], ["d3-c2", "バイアス補正の理由"],
  ["d4-c0", "内部共変量シフトの定義"], ["d4-c2", "主な効果"],
  ["d5-c1", "手法の中核（残差関数の定式化）"], ["d5-c3", "主要な定量結果"],
  ["d6-c0", "GAN の構成"], ["d6-c1", "理論的な解"],
  ["d7-c0", "深層学習の定義"],
  ["d8-c0", "Transformer の構成"], ["d8-c2", "主結果"],
  ["d9-c1", "事前学習の目的関数"], ["d9-c2", "主結果"],
  ["d10-c0", "主張"], ["d10-c2", "限界（帰納バイアスの欠如）"],
].map(([chunk_id, reason], i) => ({ id: `h${i}`, document_id: chunk_id.split("-")[0], chunk_id, kind: "ai_key", reason }));

// ファクトチェックのサンプル原稿（AI 生成を想定。誤引用を含む）
export const sampleManuscript = [
  "Residual learning enabled training networks with up to 152 layers on ImageNet (He et al., 2016).",
  "The Transformer relies solely on attention mechanisms and dispenses with recurrence and convolutions (Vaswani et al., 2017).",
  "Batch normalization eliminates the need for dropout in all network architectures (Ioffe & Szegedy, 2015).",
  "Dropout keeps all units active during training and removes units only at test time (Srivastava et al., 2014).",
  "Vision transformers outperform CNNs even when trained only on small datasets (Tanaka et al., 2021).",
].join(" ");

// サンプル文に対する判定（モック）。キーは引用の第一著者
export const presetVerdicts: Record<string, { verdict: "supported" | "partial" | "refuted"; chunk: string; note: string }> = {
  He: { verdict: "supported", chunk: "d5-c2", note: "152 層の残差ネットを ImageNet で評価した記述と一致します。" },
  Vaswani: { verdict: "supported", chunk: "d8-c0", note: "注意機構のみに基づき、再帰と畳み込みを用いないという記述と一致します。" },
  Ioffe: { verdict: "partial", chunk: "d4-c2", note: "原文は「場合によっては Dropout が不要になる」と述べており、「すべてのアーキテクチャで」は言い過ぎです。" },
  Srivastava: { verdict: "refuted", chunk: "d2-c0", note: "原文は「学習中に」ユニットをランダムに落とすと述べており、主張と逆です。" },
};
