package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.Evaluation;
import com.course.backend.mapper.EvaluationMapper;
import com.course.backend.service.EvaluationService;
import org.springframework.stereotype.Service;

@Service
public class EvaluationServiceImpl extends ServiceImpl<EvaluationMapper, Evaluation> implements EvaluationService {
}
