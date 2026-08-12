package com.course.backend.entity;

import lombok.Data;

/**
 * 素质评价提交文件
 */
@Data
public class QualityEvalFile {

    private String fileName;

    private String fileType;

    private Long fileSize;

    private String dataUrl;
}
