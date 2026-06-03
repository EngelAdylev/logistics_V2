package ru.alabuga.dislocation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.alabuga.dislocation.dto.comment.AddCommentRequest;
import ru.alabuga.dislocation.dto.comment.TripCommentDto;
import ru.alabuga.dislocation.model.TripComment;
import ru.alabuga.dislocation.repository.TripCommentRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final TripCommentRepository commentRepo;

    @Transactional(readOnly = true)
    public List<TripCommentDto> getByTrip(UUID tripId) {
        return commentRepo.findByTripIdOrderByCreatedAtAsc(tripId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public TripCommentDto add(UUID tripId, AddCommentRequest req) {
        TripComment comment = TripComment.builder()
                .tripId(tripId)
                .author(req.getAuthor())
                .body(req.getBody())
                .build();
        return toDto(commentRepo.save(comment));
    }

    private TripCommentDto toDto(TripComment c) {
        return TripCommentDto.builder()
                .id(c.getId())
                .author(c.getAuthor())
                .body(c.getBody())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
