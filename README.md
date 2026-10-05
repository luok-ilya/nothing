# nothing

# 本地画图

双击 `index.html`，用 Edge 或 Chrome 打开即可使用，无需安装或联网。

选择工具，在白色画布上拖动鼠标绘图。可选择颜色和 1–50 px 粗细；矩形、椭圆可勾选填充。
快捷键：B 画笔、E 橡皮、L 直线、R 矩形、O 椭圆；Ctrl+Z 撤销、Ctrl+Y 或 Ctrl+Shift+Z 重做、Ctrl+S 保存 PNG。

打开图片会将图片等比放入画布并替换当前内容，可撤销。支持最近 30 步撤销。
画布为 1200 × 760 px，随窗口等比显示。作品不会上传；关闭或刷新页面会丢失未导出的作品，请先保存 PNG。

若希望通过本地服务器运行，可在此目录执行 `python -m http.server 8000`，再访问 http://localhost:8000 。

## 开发验证

应用本身无需依赖。运行自动验证需要 Node.js 和 Microsoft Edge：执行 `npm install`，然后 `npm test`。测试会启动无界面浏览器，验证绘图、撤销重做、导入导出和手机宽度布局。
