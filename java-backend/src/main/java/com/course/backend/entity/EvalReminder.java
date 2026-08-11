package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评价提醒
 */
@Data
@TableName("eval_reminder")
public class EvalReminder {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String courseTitle;

    private String studentId;

    /** 第N次评价 */
    private Integer sessionNumber;

    /** 截止时间（兼容前端日期字符串，如 2026-08-20 或 2026-08-20T23:59:00） */
    private String deadline;

    /** pending / completed / overdue */
    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
