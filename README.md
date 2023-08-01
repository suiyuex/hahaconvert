## Install

```bash
git clone https://github.com/suiyuex/hahaconvert
cd hahaconvert

# 编译可执行程序
deno task compile
# 安装为cli
deno task install

#卸载cli
deno task uninstall
```



## Usage

导出ods(xlsx)到json

默认情况下，表名以`!`开头会被忽略

```bash
hahaconvert export path/to/file.ods folder

# -o 设置导出的目录
```

如果传入目录，会递归获取目录下所有`*.ods`, `*.xls`, `*.xlsx`文件

默认情况下导出json

导出的json会放在源文件的文件夹

data/my.ods -> data/my.json

表头行必须存在
默认情况下，表的第一行为表头行，表头行每一个列为这列数据的key
表头行的下一行会被忽略，用于描述每列的行


表头行格式`!key[#type]`，如果以`!`开头则不会导出本列

`#type`可选, 类型默认为string

类型支持

- int
- bool
- string
- int[]
- [] 字符串数组

数组默认分隔符为 ','


![img](imgs/img1.png)



TODO

- 导出xml