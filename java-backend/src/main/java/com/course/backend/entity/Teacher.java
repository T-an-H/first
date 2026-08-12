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
 * 教师（基础数据）
 */
@Data
@TableName(value = "teacher", autoResultMap = true)
public class Teacher {

    @TableId(type = IdType.INPUT)
    private String id;

    /** 姓名（显示名） */
    private String name;

    private String phone;

    private String email;

    private String avatar;

    /** 授课课程ID列表，DB 中以 JSON 数组字符串存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> courseIds;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
