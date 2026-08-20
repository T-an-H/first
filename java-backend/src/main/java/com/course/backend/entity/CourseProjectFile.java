package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 项目文件（预习/工单/资料/测试题目）
 */
@Data
@TableName("course_project_file")
public class CourseProjectFile {

    @TableId(type = IdType.INPUT)
    private String id;

    private String projectId;

    /** preview预习 / workorder工单 / material资料 / test测试题目 */
    private String fileType;

    private String name;

    private Long size;

    private String dataUrl;

    private LocalDateTime createdAt;
}
