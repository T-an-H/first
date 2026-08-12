package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.HomeworkSubmission;
import com.course.backend.mapper.HomeworkSubmissionMapper;
import com.course.backend.service.HomeworkSubmissionService;
import org.springframework.stereotype.Service;

@Service
public class HomeworkSubmissionServiceImpl extends ServiceImpl<HomeworkSubmissionMapper, HomeworkSubmission> implements HomeworkSubmissionService {
}
