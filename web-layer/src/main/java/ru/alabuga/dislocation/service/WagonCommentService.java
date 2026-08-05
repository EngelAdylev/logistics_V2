package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.comment.WagonCommentDto;
import ru.alabuga.dislocation.model.WagonComment;
import ru.alabuga.dislocation.repository.WagonCommentRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WagonCommentService {

    private final WagonCommentRepository repo;

    @Transactional(readOnly = true)
    public List<WagonCommentDto> getByWagon(UUID wagonId) {
        return repo.findByWagonIdOrderByCreatedAtAsc(wagonId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public WagonCommentDto add(UUID wagonId, String author, String body) {
        WagonComment saved = repo.save(WagonComment.builder()
                .wagonId(wagonId)
                .author(author)
                .body(body)
                .build());
        return toDto(saved);
    }

    private WagonCommentDto toDto(WagonComment c) {
        return WagonCommentDto.builder()
                .id(c.getId())
                .author(c.getAuthor())
                .body(c.getBody())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
