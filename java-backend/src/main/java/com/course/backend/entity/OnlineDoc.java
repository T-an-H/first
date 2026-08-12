package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 在线文档
 */
@Data
@TableName("online_doc")
public class OnlineDoc {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String content;

    /** 创建人 */
    private String createdBy;

    /** 最后编辑人 */
    private String lastEditedBy;

    /** 创建时间（兼容前端日期字符串） */
    private String createdAt;

    /** 最后编辑时间（兼容前端日期字符串） */
    private String lastEditedAt;
}
