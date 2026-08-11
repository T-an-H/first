package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 课程评价
 */
@Data
@TableName("evaluation")
public class Evaluation {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String studentId;

    /** 第N次评价 */
    private Integer sessionNumber;

    /** self / intra_group / inter_group / teacher / mentor */
    private String type;

    private BigDecimal score;

    private String evaluatorId;

    private String evaluatorName;

    private String comment;

    private LocalDateTime createdAt;
}
