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
 * 学院领导（基础数据）
 */
@Data
@TableName(value = "leader", autoResultMap = true)
public class Leader {

    @TableId(type = IdType.INPUT)
    private String id;

    /** 姓名（显示名） */
    private String name;

    private String phone;

    private String email;

    /** 管辖分类ID列表，DB 中以 JSON 数组字符串存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> categoryIds;

    /** 是否兼任授课教师 0/1 */
    private Boolean asTeacher;

    /** 作为教师授课的课程ID列表 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> teacherCourseIds;

    /** 是否兼任企业导师 0/1 */
    private Boolean asMentor;

    /** 作为导师负责的课程ID列表 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> mentorCourseIds;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
