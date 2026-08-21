package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 考试/项目成绩
 */
@Data
@TableName("exam_score")
public class ExamScore {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String studentId;

    /** 考试/项目名称，如"期中考试" */
    private String examName;

    private BigDecimal score;

    /** 满分 */
    private BigDecimal fullScore;

    /** 权重（百分比） */
    private Integer weight;

    /** midterm_exam / midterm_project / final_exam / final_project / quiz / assignment */
    private String type;

    /** draft / submitted */
    private String status;

    private LocalDateTime gradedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
