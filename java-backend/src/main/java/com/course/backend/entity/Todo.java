package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 待办事项
 */
@Data
@TableName("todo")
public class Todo {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    /** 是否完成 0/1 */
    private Boolean completed;

    /** 截止时间（兼容前端日期字符串，如 2026-08-20） */
    private String dueDate;

    /** 创建人 */
    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
