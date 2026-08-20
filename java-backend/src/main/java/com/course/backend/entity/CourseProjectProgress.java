package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 项目学生进度（预习查看/工单提交/资料查看/测试完成）
 */
@Data
@TableName(value = "course_project_progress", autoResultMap = true)
public class CourseProjectProgress {

    @TableId(type = IdType.INPUT)
    private String id;

    private String projectId;

    /** 学生内部 ID（stu-xxx） */
    private String studentId;

    /** preview预习 / workorder工单 / material资料 / test测试 */
    private String progressType;

    /** viewed已查看 / submitted已提交 / graded已批改 */
    private String status;

    /** 教师评分（工单/测试） */
    private BigDecimal score;

    /** 备注/评语 */
    private String comment;

    /** 学生提交附件（JSON 数组） */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Object> attachments;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
