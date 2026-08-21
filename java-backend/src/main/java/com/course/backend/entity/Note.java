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
 * 笔记
 */
@Data
@TableName(value = "note", autoResultMap = true)
public class Note {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String content;

    /** 创建人 */
    private String createdBy;

    /** 附件列表，DB 中以 JSON 数组字符串存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<NoteAttachment> attachments;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 笔记附件
     */
    @Data
    public static class NoteAttachment {
        private String fileName;
        private Long fileSize;
        private String fileType;
        private String dataUrl;
    }
}
