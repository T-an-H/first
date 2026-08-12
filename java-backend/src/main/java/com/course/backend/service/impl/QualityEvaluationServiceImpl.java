package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.QualityEvaluation;
import com.course.backend.mapper.QualityEvaluationMapper;
import com.course.backend.service.QualityEvaluationService;
import org.springframework.stereotype.Service;

@Service
public class QualityEvaluationServiceImpl extends ServiceImpl<QualityEvaluationMapper, QualityEvaluation> implements QualityEvaluationService {
}
