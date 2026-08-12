package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.ExamScore;
import com.course.backend.mapper.ExamScoreMapper;
import com.course.backend.service.ExamScoreService;
import org.springframework.stereotype.Service;

@Service
public class ExamScoreServiceImpl extends ServiceImpl<ExamScoreMapper, ExamScore> implements ExamScoreService {
}
