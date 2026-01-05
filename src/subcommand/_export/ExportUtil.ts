// 验证数据是否需要被导出，返回true则验证通过，false验证失败即数据不导出
export function validateName(name: string) {
    if (name === null || name === undefined) return false;
    // console.log("validate: " + name + " type: " + typeof name);
    if (name.trim().startsWith("!")) return false;
    return true;
}
