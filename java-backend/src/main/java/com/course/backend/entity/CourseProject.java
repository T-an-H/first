package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 课程项目（知识图谱节点，每 2 学时一个项目）
 */
@Data
@TableName("course_project")
public class CourseProject {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    /** 项目名称 */
    private String name;

    /** 学时（默认 2） */
    private Integer hours;

    /** 教学内容 */
    private String content;

    /** 重点/难点 */
    private String keyPoints;

    /** 知识点 */
    private String knowledgePoints;

    /** 排序号 */
    private Integer orderNo;

    /** 周次（可选） */
    private String weekNo;

    /** 关联测试任务 ID（course_task，评价迁移） */
    private String testTaskId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
