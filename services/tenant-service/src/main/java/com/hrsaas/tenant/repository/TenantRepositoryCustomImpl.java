package com.hrsaas.tenant.repository;

import com.hrsaas.tenant.domain.dto.request.TenantSearchRequest;
import com.hrsaas.tenant.domain.entity.Tenant;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class TenantRepositoryCustomImpl implements TenantRepositoryCustom {

    private final EntityManager entityManager;

    @Override
    public Page<Tenant> search(TenantSearchRequest request, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Tenant> countRoot = countQuery.from(Tenant.class);
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, request);
        countQuery.select(cb.count(countRoot));
        if (!countPredicates.isEmpty()) {
            countQuery.where(countPredicates.toArray(new Predicate[0]));
        }
        long total = entityManager.createQuery(countQuery).getSingleResult();

        // Data query
        CriteriaQuery<Tenant> dataQuery = cb.createQuery(Tenant.class);
        Root<Tenant> dataRoot = dataQuery.from(Tenant.class);
        List<Predicate> dataPredicates = buildPredicates(cb, dataRoot, request);
        dataQuery.select(dataRoot);
        if (!dataPredicates.isEmpty()) {
            dataQuery.where(dataPredicates.toArray(new Predicate[0]));
        }

        // Sorting
        List<Order> orders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (order.isAscending()) {
                orders.add(cb.asc(dataRoot.get(order.getProperty())));
            } else {
                orders.add(cb.desc(dataRoot.get(order.getProperty())));
            }
        }
        if (orders.isEmpty()) {
            orders.add(cb.desc(dataRoot.get("createdAt")));
        }
        dataQuery.orderBy(orders);

        TypedQuery<Tenant> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<Tenant> content = typedQuery.getResultList();
        return new PageImpl<>(content, pageable, total);
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<Tenant> root, TenantSearchRequest request) {
        List<Predicate> predicates = new ArrayList<>();

        if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
            String keyword = "%" + request.getKeyword().toLowerCase() + "%";
            predicates.add(cb.or(
                cb.like(cb.lower(root.get("name")), keyword),
                cb.like(cb.lower(root.get("code")), keyword)
            ));
        }

        if (request.getStatus() != null) {
            predicates.add(cb.equal(root.get("status"), request.getStatus()));
        }

        if (request.getPlanType() != null) {
            predicates.add(cb.equal(root.get("planType"), request.getPlanType()));
        }

        if (request.getContractEndDateFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("contractEndDate"), request.getContractEndDateFrom()));
        }

        if (request.getContractEndDateTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("contractEndDate"), request.getContractEndDateTo()));
        }

        return predicates;
    }
}
