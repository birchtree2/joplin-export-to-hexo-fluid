---
title: README
date: 2023-4-20 19:30:21
excerpt: README
---
# 将Joplin的笔记软件一键导出到hexo博客

**Step1.** 下载Release中的`export.note.toHexo.jpl
`,并导入到joplin

**Step2.** 选择笔记后右键，在菜单中点击Export Note to SSG
![13dfb38303ace9e6de2355887e3510b4.png](/img/13dfb38303ace9e6de2355887e3510b4.png)

**Step3.** 在弹出窗口中填写信息
![4dd53f52ee8e8031401e021b2965b069.png](/img/4dd53f52ee8e8031401e021b2965b069.png)



- `Project Path`: hexo博客根目录的绝对路径。文章会存储在该目录下`.\source\_posts`, 文章中的图片等资源会存储在`.\source\img`
    参考[Hexo Flulid用户手册](https://hexo.fluid-dev.com/docs/guide/#%E5%85%B3%E4%BA%8E%E6%8C%87%E5%8D%97)

​	下面几个选项用于设置hexo的front matter(参考[hexo.io](https://hexo.io/zh-cn/docs/front-matter))

- `Title`: 自定义博客标题，如果留空，则默认为Joplin里的标题
- `Tags`: 标签，用**空格隔开**
- `Categories`: 分类，用**逗号隔开**,如`aaa,bbb`表示`aaa`分类里面的`bbb`子分类
- `Excerpt`: 摘要。如果留空，则以标题作为摘要
- `Front Matter`: 补充的front matter指令。如无特别要求，最好留空

输出的frontmatter示例如下

![57ed96d062496400d49a25e9e0d13c62.png](/img/57ed96d062496400d49a25e9e0d13c62.png)
**Step4.** 点击Export, 笔记自动导出到博客目录下。之后再手动执行hexo命令即可. 如果**笔记已经导出过**，则默认不会替换原来的frontmatter,**只会更新内容**，这种情况下可以把导出界面除博客目录外的内容留空。

可能出现的问题以及解决方案:
- **右键菜单栏Export Note to SSG不显示**: 点击另外一个笔记本，再点击原来的笔记，就可以显示了.(可能是Joplin的bug)
- **导出笔记本所有笔记后输出目录为空**: 参考[issue](https://github.com/aman-d-1-n-only/joplin-exports-to-ssg/issues/1)

