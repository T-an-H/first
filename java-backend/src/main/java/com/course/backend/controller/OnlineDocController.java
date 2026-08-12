package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.OnlineDoc;
import com.course.backend.service.OnlineDocService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 在线文档接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class OnlineDocController {

    private final OnlineDocService onlineDocService;

    /**
     * GET /api/teaching/online-docs  文档列表
     * 可选参数：createdBy
     */
    @GetMapping("/online-docs")
    public Result<List<OnlineDoc>> listDocs(@RequestParam(required = false) String createdBy) {
        QueryWrapper<OnlineDoc> qw = new QueryWrapper<>();
        if (StringUtils.hasText(createdBy)) qw.eq("created_by", createdBy);
        qw.orderByDesc("last_edited_at");
        return Result.ok(onlineDocService.list(qw));
    }

    /**
     * POST /api/teaching/online-docs  新增文档
     * body: { id?, title, content?, createdBy, lastEditedBy? }
     */
    @PostMapping("/online-docs")
    public Result<OnlineDoc> addDoc(@RequestBody OnlineDoc doc) {
        if (!StringUtils.hasText(doc.getId())) {
            doc.setId("doc-" + System.currentTimeMillis());
        }
        if (!StringUtils.hasText(doc.getLastEditedBy())) {
            doc.setLastEditedBy(doc.getCreatedBy());
        }
        onlineDocService.save(doc);
        return Result.ok(doc);
    }

    /**
     * PUT /api/teaching/online-docs/{id}  更新文档（标题/内容/最后编辑人）
     */
    @PutMapping("/online-docs/{id}")
    public Result<OnlineDoc> updateDoc(@PathVariable String id, @RequestBody OnlineDoc doc) {
        doc.setId(id);
        onlineDocService.updateById(doc);
        return Result.ok(onlineDocService.getById(id));
    }

    /**
     * DELETE /api/teaching/online-docs/{id}  删除文档
     */
    @DeleteMapping("/online-docs/{id}")
    public Result<Void> deleteDoc(@PathVariable String id) {
        onlineDocService.removeById(id);
        return Result.ok();
    }
}
