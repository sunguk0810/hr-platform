package com.hrsaas.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Paginated response wrapper.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private PageInfo page;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageInfo {
        private int number;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean first;
        private boolean last;
        private boolean hasNext;
        private boolean hasPrevious;
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
            .content(page.getContent())
            .page(PageInfo.builder()
                .number(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build())
            .build();
    }

    public static <T, R> PageResponse<R> from(Page<T> page, List<R> content) {
        return PageResponse.<R>builder()
            .content(content)
            .page(PageInfo.builder()
                .number(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build())
            .build();
    }
}
