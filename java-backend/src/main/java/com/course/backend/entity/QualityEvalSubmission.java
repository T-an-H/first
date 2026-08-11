package com.course.backend.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 单次素质评价提交记录（学生可多次提交，教师可对任意一次评分）
 */
@Data
public class QualityEvalSubmission {

    private String id;

    private String description;

    private List<QualityEvalFile> files;

    /** 学生提交时间 */
    private String submittedAt;

    /** 教师打分（0-100），为空表示未批改 */
    private BigDecimal score;

    /** 教师评语 */
    private String teacherComment;

    /** 批改时间 */
    private String gradedAt;
}
