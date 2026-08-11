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
 * 素质评价（submissions 为提交记录列表，DB 中以 JSON 数组存储）
 */
@Data
@TableName(value = "quality_evaluation", autoResultMap = true)
public class QualityEvaluation {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String studentId;

    /** 多次提交记录，按提交时间先后排列 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<QualityEvalSubmission> submissions;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
