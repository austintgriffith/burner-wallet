import styled from 'styled-components';
import {Card} from 'rimble-ui';

const StyledCard = styled(Card).attrs(()=>({
  my: 0,
  p: 3
}))`
  border-radius: 4px;
`;

export default StyledCard;
