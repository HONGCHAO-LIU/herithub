export interface HeritageItem {
  名称: string;
  网址: string;
  描述: string;
  来源: string;
  分类: string;
  地区: string;
  平台类型?: string;
  sub_category?: string;
  type?: string;
  国家?: string;
  省份?: string;
  实体类型?: string;
  详细分类?: string;
  标签?: string[];
  图片URL?: string;
  完整地区?: string;
  数据创建时间?: string;
  数据更新时间?: string;
  简介?: string;
  验证时间?: string;
  可访问?: boolean;
  主题相关?: boolean;
}
