class stringValidator {
    static containsChineseCharacters(str) {
        const chineseRegex = /[\u4e00-\u9fa5]/; // 正则表达式匹配中文字符
        return chineseRegex.test(str); // 返回 true 或 false
    }
}

module.exports = stringValidator;