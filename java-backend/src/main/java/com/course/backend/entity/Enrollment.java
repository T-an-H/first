package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 选课记录
 */
@Data
@TableName("enrollment")
public class Enrollment {

    @TableId(type = IdType.INPUT)
    private String id;

    private String studentId;

    private String courseId;

    private String scheduleId;

    private LocalDate enrollDate;

    private Integer progress;

    /** enrolled / in_progress / completed / dropped */
    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
