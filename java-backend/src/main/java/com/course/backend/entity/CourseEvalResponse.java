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
 * 评教填写记录
 */
@Data
@TableName(value = "course_eval_response", autoResultMap = true)
public class CourseEvalResponse {

    @TableId(type = IdType.INPUT)
    private String id;

    private String questionnaireId;

    /** 学生内部 ID（stu-xxx） */
    private String studentId;

    /** 答案列表（JSON 数组） */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Object> answers;

    private LocalDateTime createdAt;
}
