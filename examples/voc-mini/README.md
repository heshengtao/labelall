# voc-mini — 一个超小的 Pascal VOC 示例数据集

用来快速试一下 LabelAll：3 张 320×240 的真实图片，共 6 个标注框、2 个类别
（`rectangle`、`circle`）。

```
voc-mini/
├── JPEGImages/      0001.jpg 0002.jpg 0003.jpg
├── Annotations/     0001.xml 0002.xml 0003.xml
└── ImageSets/Main/  train.txt
```

在 LabelAll 里点「打开数据集」，选择这个 `voc-mini` 文件夹即可：检测结果会是
**Pascal VOC**，确认后就能看到三个矩形框/圆形标注（圆形以包围盒表示）。

> 图片是脚本画出来的简单形状，但都是真实的 JPEG，不是占位文件——目的是让标注框与
> 图形边缘一眼就能对上，方便验证显示是否正确。

---

# voc-mini — a tiny Pascal VOC example dataset

Three real 320×240 JPEGs with six boxes across two classes (`rectangle`, `circle`),
laid out the canonical Pascal VOC way. Open the `voc-mini` folder in LabelAll; it is
detected as Pascal VOC, and the boxes line up with the drawn shapes on purpose so you
can eyeball that overlays are placed correctly.
