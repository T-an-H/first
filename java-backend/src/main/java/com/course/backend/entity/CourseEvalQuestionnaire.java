package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 评教问卷（每课程一份）
 */
@Data
@TableName(value = "course_eval_questionnaire", autoResultMap = true)
public class CourseEvalQuestionnaire {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String title;

    /** 题目列表（JSON 数组） */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Object> questions;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
