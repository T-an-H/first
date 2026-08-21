package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 课程资源
 */
@Data
@TableName(value = "course_file", autoResultMap = true)
public class CourseFile {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String name;

    private Long size;

    private String type;

    private String dataUrl;

    private LocalDate uploadedAt;

    private String uploadedBy;

    /** private / students */
    private String visibilityScope;

    /** 可见班级列表，DB 中以 JSON 数组字符串存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> visibleToClassNames;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
